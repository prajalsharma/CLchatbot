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

export const print_details_on_console = async (
  ecosystem: string,
  category: string,
  fundingType: string,
  fundingAmount: string,
  projectDescription: string
): Promise<Grant[] | undefined> => {
  console.log(
    ecosystem,
    category,
    fundingType,
    fundingAmount,
    projectDescription
  );

  const detailsObject = {
    ecosystem,
    category,
    fundingType,
    fundingAmount,
    projectDescription,
  };

  console.log("detailsObject is", detailsObject);

  const userQueryString = Object.entries(detailsObject)
    .map(([key, value]) => `${capitalize(key)}: ${value}`)
    .join("\n");

  function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  console.log("Details of user from chatgpt:\n" + userQueryString);

  const top5matches = await handleConsole({
    ecosystem,
    fundingTopics: category,
    fundingType,
    description: projectDescription,
    totalFundingAvailable: fundingAmount,
  });

  return top5matches;
};

const handleConsole = async (
  userFields: Record<string, string>
): Promise<Grant[] | undefined> => {
  console.log("User Fields:", userFields);

  try {
    const userEmbeddings: Record<string, number[]> = {};

    for (const field in userFields) {
      const res = await fetch("/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userFields[field] || "" }),
      });

      const { embedding } = await res.json();
      userEmbeddings[field] = embedding;
    }

    console.log("✅ User Field-wise Embeddings:", userEmbeddings);

    try {
      const embeddedGrants = await loadEmbeddedGrants();
      const matches = findTopMatches(userEmbeddings, embeddedGrants);
      console.log("🎯 Top matches:", matches);
      return matches;
    } catch (error) {
      console.error("❌ Error loading grants or matching:", error);
    }
  } catch (err) {
    console.error("❌ Error getting embeddings:", err);
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
