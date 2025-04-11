import { Dot } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";

const coreFeatures = [
  {
    title: "The Largest Web3 Grants Database",
    description:
      "Access the most extensive and up-to-date database of grant opportunities, updated every 48 hours. Stay ahead with real-time updates on new funding programs, eligibility criteria, and deadlines.",
  },
  {
    title: (
      <>
        AI-Powered Grant Matching{" "}
        <a
          href="https://tally.so/r/wb6d0o"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline">
          (Coming Soon)
        </a>
      </>
    ),
    description:
      "No more searching through endless programs—just fill out a simple form, and our AI-backed tool will match you with the most suitable grant opportunities for your project.",
  },
  {
    title: (
      <>
        Data-Driven Grant Analytics{" "}
        <a
          href="https://tally.so/r/wb6d0o"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline">
          (Coming Soon)
        </a>
      </>
    ),
    description:
      "Gain strategic insights with our analytics tools. Assess grant program strengths, identify gaps, and measure the impact of funded projects. Designed for builders and funding protocols looking to optimize grant allocation.",
  },
  {
    title: (
      <>
        Expanding Beyond Web3{" "}
        <a
          href="https://tally.so/r/wb6d0o"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline">
          (Coming Soon)
        </a>
      </>
    ),
    description:
      "While our platform focuses on Web3 projects and ecosystem grants, we are expanding to integrate and analyze institutional funding sources and broader grant categories—bridging the gap between Web3 and traditional funding to help builders and protocols diversify funding strategies and make data-backed decisions for long-term growth.",
  },
];

const team = [
  {
    name: "Marianna Charalambous",
    link: "https://www.linkedin.com/in/mariannacharalambous/",
    role: "Project Lead, Head of Operations – Oversees platform development and strategic initiatives.",
  },
  {
    name: "Dr. Androniki Menelaou",
    link: "https://www.linkedin.com/in/androniki-menelaou-7994aa60/",
    role: "Head of AI and Data Analytics – Drives the design of AI algorithms and advanced analytics.",
  },
  {
    name: "Mariana de la Roche W. (BlackVogel)",
    link: "https://www.linkedin.com/in/mariana-de-la-roche-es/",
    role: "Head of BD – Manages business development and community outreach.",
  },
  {
    name: "Stamatis Manos Papangelou",
    link: "https://www.linkedin.com/in/stamatis-papangelou/",
    role: "DLTs, AI and Data Analytics Advisor – Offers expert guidance on machine learning models and data strategy.",
  },
];

const AboutUs = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-white border-white text-base">
          About Us
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#151226] text-white/70 text-sm">
        <DialogTitle className="text-2xl text-white">
          CL Web3 Grants Dashboard: Find. Match. Analyze.
        </DialogTitle>
        <DialogDescription className="sr-only">About the project</DialogDescription>
        <ScrollArea className="max-h-[350px]">
          <div className="flex flex-col gap-4">
            <p>
              CL Web3 Grants Dashboard by{" "}
              <a
                href="http://www.cornarolabs.xyz"
                target="_blank"
                className="text-blue-500 hover:underline">
                Cornaro Labs
              </a>{" "}
              is designed{" "}
              <span className="font-semibold text-slate-50">
                to revolutionize how Web3 grant programs are accessed, managed, and analyzed.
              </span>
              The platform is built in collaboration with{" "}
              <a
                href="https://www.blackvogel.com/"
                target="_blank"
                className="text-blue-500 hover:underline">
                BlackVogel Consulting
              </a>{" "}
              and{" "}
              <a
                href="https://hbi.gr/en/"
                target="_blank"
                className="text-blue-500 hover:underline">
                Hareva Business Ideas.
              </a>
            </p>
            <p>
              The idea for this came from a common frustration: finding a{" "}
              <span className="font-semibold text-slate-50">
                reliable, up-to-date resource for ACTIVE and UPCOMING grant opportunities.
              </span>
              Many existing databases are static, created once and forgotten. We wanted to change
              that by ensuring this database stays relevant and genuinely useful for Web3 projects
              seeking funding.
            </p>
            <p>
              In addition to providing support to builders looking for grant funding, our solution
              provides a comprehensive analytics dashboard tailored for Web3 grant programs. It
              integrates key metrics, AI-powered grant matchmaking, data-driven analytics, and
              impact measurement tools to enhance decision-making and optimize funding strategies.
            </p>
            <p>
              Backed by experts in grants, blockchain, and AI, we provide a data solution for both
              Web3 funding protocols and builders, helping them make smarter decisions, track
              impact, and achieve better results with actionable insights.
            </p>
            <div>
              <h3 className="text-lg text-white font-bold underline">Our Core Features</h3>
              <div className="flex flex-col gap-4">
                {coreFeatures.map((feature, index) => (
                  <div key={index} className="flex flex-col gap-2">
                    <h4 className="text-[0.95rem] font-semibold text-white">{feature.title}</h4>
                    <p className="text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg text-white font-bold underline">Our Team</h3>
              <div className="flex flex-col gap-2">
                {team.map((member) => (
                  <div key={member.name} className="flex flex-col">
                    <h4 className="text-[0.95rem] font-semibold text-white flex items-center">
                      <Dot className="w-4 h-4" />
                      <a
                        href={member.link}
                        target="_blank"
                        className="text-blue-500 hover:underline">
                        {member.name}
                      </a>
                    </h4>
                    <p className="text-sm ml-4">{member.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        <p className="text-lg text-center text-white font-semibold">
          Built with ❤️ by{" "}
          <a
            href="https://workpadhq.com/"
            target="_blank"
            className="text-blue-500 hover:underline">
            WorkPadHQ team
          </a>
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default AboutUs;
