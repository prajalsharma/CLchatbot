const url = process.env.VITE_URL as string;

interface Grant {
  embedding: number[];
  [key: string]: any;
}

export const print_details_on_console = (
  ecosystem: string,
  category: string,
  fundingType: string,
  fundingAmount: string,
  projectDescription: string
): Promise<Grant[] | undefined> => {
  console.log(ecosystem, category, fundingType, fundingAmount, projectDescription);

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

  const top5matches = handleConsole(userQueryString);
  return top5matches;
};

const handleConsole = async (userQueryString: string): Promise<Grant[] | undefined> => {
  console.log("User Query String:", userQueryString);
  try {
    const userEmbedding = await getUserEmbedding(userQueryString);
    console.log("✅ User Embedding:", userEmbedding);
    try {
      const embeddedGrants = await loadEmbeddedGrants();
      const matches = findTopMatches(userEmbedding, embeddedGrants);
      console.log("🎯 Top matches:", matches);
      return matches;
    } catch (error) {
      console.error("Error in handleConsole: in cosine similarity", error);
    }
  } catch (err) {
    console.error("❌ Error getting embedding:", err);
  }
};

async function getUserEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${url}/api/embed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const data = await res.json();
  console.log("🎯 Embedding from API:", data.embedding);
  return data.embedding;
}

async function loadEmbeddedGrants(): Promise<Grant[]> {
  const response = await fetch("./embeddedGrants.json");
  if (!response.ok) {
    throw new Error("Failed to load embedded grants");
  }
  const text = await response.text();
  console.log("📄 Raw JSON text:", text);
  const json: Grant[] = JSON.parse(text);
  return json;
}

function findTopMatches(userEmbedding: number[], grantEmbeddings: Grant[], topK = 5): Grant[] {
  const similarities = grantEmbeddings.map((grant) => ({
    ...grant,
    similarity: cosineSimilarity(userEmbedding, grant.embedding),
  }));

  similarities.sort((a, b) => b.similarity - a.similarity);
  return similarities.slice(0, topK);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must be of same length");
  }

  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (magA === 0 || magB === 0) return 0;

  return dotProduct / (magA * magB);
}
