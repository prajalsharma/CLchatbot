"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "./ui/input";
import { EcosystemDropdown } from "./EcosystemDropdown";
import GrantCard from "./GrantCard";
import { StatusDropdown } from "./StatusDropdown";
import { FundingTopicsDropdown } from "./FundingTopicsDropdown";
import { FundingTypeDropdown } from "./FundingTypeDropdown";
import { Button } from "./ui/button";
import { RotateCcw } from "lucide-react";

interface Grant {
  id: string;
  images: string;
  grantProgramName: string;
  status: string;
  ecosystem: string;
  total?: string;
  fundingTopics?: string;
  fundingType?: string;
  website: string;
  description?: string;
  topicsForFunding?: string;
  totalFundingAvailable?: string;
  minFunding?: string;
  maxFunding?: string;
  date?: string;
  searchFundingTopics?: string[];
  searchFundingType?: string;
}

const API_KEY = process.env.VITE_API_KEY as string;
const SHEET_ID = process.env.VITE_SHEET_ID as string;
const RANGE = process.env.VITE_RANGE as string;

const Board = () => {
  const [selectedEcosystems, setSelectedEcosystems] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedFundingTopics, setSelectedFundingTopics] = useState<string[]>([]);
  const [selectedFundingTypes, setSelectedFundingTypes] = useState<string[]>([]);
  const [selectedSortBy, setSelectedSortBy] = useState<string[]>([]);
  const [grantPrograms, setGrantPrograms] = useState<Grant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const grantsPerPage = 20;

  const fetchGrants = async () => {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await response.json();

      if (data.values && data.values.length > 1) {
        const headers = data.values[0];
        const formattedData = data.values.slice(1).map((row: string[]) => {
          const grant = headers.reduce((acc: any, header: string, index: number) => {
            acc[header] = row[index] || "";
            return acc;
          }, {});

          return {
            ...grant,
            id: crypto.randomUUID(),
            searchFundingTopics: grant.fundingTopics
              ? grant.fundingTopics.toLowerCase().replace(/\s+/g, "").split(",")
              : [],
            searchFundingType: grant.fundingType
              ? grant.fundingType.toLowerCase().replace(/\s+/g, "")
              : "",
          };
        });

        setGrantPrograms(formattedData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGrants();
  }, []);

  const filteredAndSortedGrants = useMemo(() => {
    let filtered = grantPrograms.filter((grant) => {
      return (
        (selectedEcosystems.length === 0 || selectedEcosystems.includes(grant.ecosystem)) &&
        (selectedStatuses.length === 0 || selectedStatuses.includes(grant.status)) &&
        (selectedFundingTopics.length === 0 ||
          grant.searchFundingTopics?.some((topic) =>
            selectedFundingTopics.map((t) => t.toLowerCase().replace(/\s+/g, "")).includes(topic)
          )) &&
        (selectedFundingTypes.length === 0 ||
          selectedFundingTypes
            .map((t) => t.toLowerCase().replace(/\s+/g, ""))
            .includes(grant.searchFundingType || "")) &&
        (!searchQuery ||
          [
            grant.grantProgramName,
            grant.description,
            grant.topicsForFunding,
            grant.fundingTopics,
            grant.fundingType,
          ]
            .filter(Boolean)
            .some(
              (field) =>
                (field?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
                new RegExp(`\\b${searchQuery}`, "i").test(field ?? "")
            ))
      );
    });

    if (selectedSortBy.includes("mostRecent")) {
      filtered = [...filtered].sort((a, b) => {
        const dateA = a.date ? new Date(a.date + "-01") : new Date(0);
        const dateB = b.date ? new Date(b.date + "-01") : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
    }

    if (selectedSortBy.includes("funding")) {
      filtered = [...filtered].sort((a, b) => {
        const totalA = a.total ? Number(a.total.replace(/[$,]/g, "")) : 0;
        const totalB = b.total ? Number(b.total.replace(/[$,]/g, "")) : 0;
        return totalB - totalA;
      });
    }

    return filtered;
  }, [
    grantPrograms,
    selectedEcosystems,
    selectedStatuses,
    selectedFundingTopics,
    selectedFundingTypes,
    selectedSortBy,
    searchQuery,
  ]);

  const paginatedGrants = useMemo(() => {
    const startIndex = (currentPage - 1) * grantsPerPage;
    const endIndex = startIndex + grantsPerPage;
    return filteredAndSortedGrants.slice(startIndex, endIndex);
  }, [filteredAndSortedGrants, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedGrants.length / grantsPerPage);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div className="my-5 flex flex-col gap-4 p-5 rounded-lg justify-center backdrop-blur bg-white/5">
        <Input
          placeholder="Search Grants..."
          className="bg-[#151226]/50 border-[#151226] text-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="flex flex-col gap-4 md:flex-row">
          <EcosystemDropdown
            selectedValues={selectedEcosystems}
            setSelectedValues={setSelectedEcosystems}
          />
          <StatusDropdown
            selectedValues={selectedStatuses}
            setSelectedValues={setSelectedStatuses}
          />
          <FundingTopicsDropdown
            selectedValues={selectedFundingTopics}
            setSelectedValues={setSelectedFundingTopics}
          />
          <FundingTypeDropdown
            selectedValues={selectedFundingTypes}
            setSelectedValues={setSelectedFundingTypes}
          />
        </div>

        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="ml-2 flex gap-3 items-center flex-wrap">
            <h3 className="font-semibold text-white">Sort By:</h3>
            {["funding"].map((criteria) => (
              <Button
                key={criteria}
                className={`h-auto bg-[#151226]/70 text-white hover:bg-[#151226] ${
                  selectedSortBy.includes(criteria) && "bg-[#00bbfc] hover:bg-[#00bbfc]/50"
                }`}
                onClick={() =>
                  setSelectedSortBy((prev) => {
                    if (prev.includes(criteria)) {
                      return prev.filter((item) => item !== criteria);
                    }

                    return [...prev, criteria];
                  })
                }>
                {criteria === "mostRecent" ? "Most Recent" : "Funding"}
              </Button>
            ))}
          </div>
          <Button
            className="bg-[#151226]/70 h-auto hover:bg-[#151226]"
            onClick={() => {
              setSelectedEcosystems([]);
              setSelectedStatuses([]);
              setSelectedFundingTopics([]);
              setSelectedFundingTypes([]);
              setSelectedSortBy([]);
              setSearchQuery("");
            }}>
            <RotateCcw />
            Reset Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="text-center">Loading...</div>
        ) : paginatedGrants.length === 0 ? (
          <div className="text-center text-white text-xl py-6">No grants found.</div>
        ) : (
          paginatedGrants.map((grant) => <GrantCard key={grant.id} grant={grant} />)
        )}
      </div>
      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          className="bg-[#151226]/70 text-white px-4 py-2 rounded disabled:opacity-50 hover:opacity-80 transition"
          onClick={() => {
            setCurrentPage(1);
            window.scrollTo({ top: 100 });
          }}
          disabled={currentPage === 1}>
          First
        </button>

        <button
          className="bg-[#151226]/70 text-white px-4 py-2 rounded disabled:opacity-50 hover:opacity-80 transition"
          onClick={() => {
            setCurrentPage((prev) => Math.max(prev - 1, 1));
            window.scrollTo({ top: 100 });
          }}
          disabled={currentPage === 1}>
          Previous
        </button>
        <span className="text-white bg-[#151226] rounded px-4 py-2">{currentPage}</span>
        <button
          className="bg-[#151226]/70 text-white px-4 py-2 rounded disabled:opacity-50 hover:opacity-80 transition"
          onClick={() => {
            setCurrentPage((prev) => Math.min(prev + 1, totalPages));
            window.scrollTo({ top: 100 });
          }}
          disabled={currentPage === totalPages}>
          Next
        </button>
        <button
          className="bg-[#151226]/70 text-white px-4 py-2 rounded disabled:opacity-50 hover:opacity-80 transition"
          onClick={() => {
            setCurrentPage(totalPages);
            window.scrollTo({ top: 100 });
          }}
          disabled={currentPage === totalPages}>
          Last
        </button>
      </div>
    </div>
  );
};

export default Board;
