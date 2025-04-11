import { useState } from "react";
import { CircleMinus, CirclePlus } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

// Define the type for the grant prop
interface Grant {
  id: string;
  images: string;
  grantProgramName: string;
  status: string;
  ecosystem: string;
  total?: string;
  fundingTopics?: string;
  website: string;
  description?: string;
  topicsForFunding?: string;
  totalFundingAvailable?: string;
  minFunding?: string;
  maxFunding?: string;
}

interface GrantCardProps {
  grant: Grant;
}

const GrantCard = ({ grant }: GrantCardProps) => {
  const [cardOpen, setCardOpen] = useState(false);

  return (
    <div className="rounded p-5 bg-[#151226]/10 text-white backdrop-blur-[3px] border border-purple-500/20">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-3">
            <img src={grant.images} alt="" className="size-11 rounded" />
            <h3 className="text-lg font-semibold">{grant.grantProgramName}</h3>
          </div>
          <div className="flex justify-evenly md:justify-between flex-1 items-center">
            <Badge className="bg-[#00bbfc] hover:bg-[#00bbfc]">{grant.status}</Badge>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex text-gray-400 gap-2.5 text-[0.95rem]">
              <span className="capitalize">
                <span className="text-white font-semibold">Ecosystem: </span>
                {grant.ecosystem}
              </span>
              {grant.total && <Separator orientation="vertical" className="bg-gray-400" />}

              {grant.total && (
                <span>
                  <span className="text-white font-semibold">Total Funding: </span>
                  {grant.total}
                </span>
              )}
            </div>
            {grant.fundingTopics && (
              <div>
                <h3 className="text-sm font-semibold">Categories:</h3>
                <p className="text-gray-400 text-sm">{grant.fundingTopics}</p>
              </div>
            )}
          </div>
          <div className="flex gap-4 items-center justify-center">
            <Button
              variant="ghost"
              className="p-0 group [&_svg]:size-7 hover:bg-transparent"
              onClick={() => setCardOpen(!cardOpen)}>
              {cardOpen ? (
                <CircleMinus className="text-[#00bbfc] group-hover:text-white  transition-colors" />
              ) : (
                <CirclePlus className=" text-[#00bbfc] group-hover:text-white transition-colors" />
              )}
            </Button>
            <a
              href={grant.website}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#00bbfc] text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-sky-600 transition-colors">
              Apply
            </a>
          </div>
        </div>
      </div>
      {cardOpen && (
        <div className="flex flex-col mt-4 gap-4">
          {grant.description && (
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold">Description:</h3>
              <p className="text-gray-400 text-sm">{grant.description}</p>
            </div>
          )}
          {grant.topicsForFunding && (
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold">Topics:</h3>
              <p className="text-gray-400 text-sm">{grant.topicsForFunding}</p>
            </div>
          )}
          {grant.totalFundingAvailable && (
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold">Funding Detail:</h3>
              <p className="text-gray-400 text-sm">{grant.totalFundingAvailable}</p>
            </div>
          )}
          {grant.minFunding && (
            <div className="flex gap-2">
              <h3 className="text-sm font-semibold">Min Funding:</h3>
              <p className="text-gray-400 text-sm">{grant.minFunding}</p>
            </div>
          )}
          {grant.maxFunding && (
            <div className="flex gap-2">
              <h3 className="text-sm font-semibold">Max Funding:</h3>
              <p className="text-gray-400 text-sm">{grant.maxFunding}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GrantCard;
