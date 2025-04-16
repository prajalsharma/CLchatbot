const PRIORITY_WEIGHTS: Record<string, number> = {
  fundingTopics: 10,
  ecosystem: 9,
  fundingType: 4,
  description: 2,
  totalFundingAvailable: 1,
};

interface Grant {
  embeddings: Record<string, number[]>;
  [key: string]: any;
}

export const handleUserDetails = async (
  ecosystem: string[],
  category: string[],
  fundingType: string[],
  fundingAmount: string,
  projectDescription: string
): Promise<Grant[] | undefined> => {

  const detailsObject = {
    ecosystem,
    category,
    fundingType,
    fundingAmount,
    projectDescription,
  };


  const userQueryString = Object.entries(detailsObject)
    .map(([key, value]) => `${capitalize(key)}: ${value}`)
    .join("\n");

  function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  const top5matches = await handleChat({
    ecosystem,
    fundingTopics: category,
    fundingType,
    description: projectDescription,
    totalFundingAvailable: fundingAmount,
  });

  return top5matches;
};

const handleChat = async (
  userFields: Record<string, string | string[]>
): Promise<Grant[] | undefined> => {
  const tagEmbeddings = await loadTagEmbeddings();
  const userEmbeddings: Record<string, number[]> = {};

  for (const field in userFields) {
    const value = userFields[field];

    // ❌ Skip non-string and non-string-array fields
    if (
      typeof value !== "string" &&
      (!Array.isArray(value) || value.some((v) => typeof v !== "string"))
    ) {
      console.warn(`⚠️ Skipping non-embeddable field: ${field}`, value);
      continue;
    }

    const values = Array.isArray(value) ? value : [value];
    const embeddings: number[][] = [];

    for (const val of values) {
      const key = val.trim(); // Safe now, we checked above

      if (tagEmbeddings[key]) {
        embeddings.push(tagEmbeddings[key]);
      } else {
        const res = await fetch("/api/embed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: key }),
        });

        const { embedding } = await res.json();
        embeddings.push(embedding);
      }
    }

    const avgEmbedding = averageVectors(embeddings);
    userEmbeddings[field] = avgEmbedding;
  }


  try {
    const embeddedGrants = await loadEmbeddedGrants();
    const matches = findTopMatches(userEmbeddings, embeddedGrants);
    return matches;
  } catch (error) {
    console.error("❌ Error loading grants or matching:", error);
  }
};

async function loadEmbeddedGrants(): Promise<Grant[]> {
  const response = await fetch("./grant_embeddings.json");
  if (!response.ok) {
    throw new Error("Failed to load embedded grants");
  }

  const text = await response.text();
  const json: Grant[] = JSON.parse(text);
  return json;
}

function findTopMatches(
  userEmbeddings: Record<string, number[]>,
  grantEmbeddings: Grant[],
  topK = 5
): Grant[] {
  const matches = grantEmbeddings.map((grant) => {
    const similarity = computeFlexibleSimilarity(
      userEmbeddings,
      grant.embeddings
    );
    return { ...grant, similarity };
  });

  matches.sort((a, b) => b.similarity - a.similarity);
  return matches.slice(0, topK);
}

function computeFlexibleSimilarity(
  userEmbeddings: Record<string, number[]>,
  grantEmbeddings: Record<string, number[]>
): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (const field in userEmbeddings) {
    if (!grantEmbeddings[field]) continue;

    const userVec = userEmbeddings[field];
    const grantVec = grantEmbeddings[field];
    const weight = PRIORITY_WEIGHTS[field] || 1;

    const sim = cosineSimilarity(userVec, grantVec);
    totalScore += sim * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must be of same length");
  }

  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

function averageVectors(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];

  const length = vectors[0].length;

  for (const vec of vectors) {
    if (vec.length !== length) {
      throw new Error("Vectors must be of same length");
    }
  }

  const sum = new Array(length).fill(0);

  for (const vec of vectors) {
    for (let i = 0; i < length; i++) {
      sum[i] += vec[i];
    }
  }

  return sum.map((val) => val / vectors.length);
}

async function loadTagEmbeddings(): Promise<Record<string, number[]>> {
  const response = await fetch("/tag_embeddings.json");
  if (!response.ok) {
    throw new Error("Failed to load tag embeddings");
  }
  return await response.json();
}
