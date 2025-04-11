import Board from "@/components/Board";
import ChatbotContainer from "@/components/ChatBot/ChatbotContainer";
import SubstackEmbed from "@/components/SubstackEmbed";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center pt-40 lg:pt-32 pb-5">
      <div className="flex flex-col items-center space-y-4">
        <h1 className="text-4xl font-medium text-center">CL Web3 Grants Dashboard</h1>
        <p className="text-[#ffffff7a] max-w-[55rem] text-center px-4">
          A public good initiative empowering Web3 projects through a dynamic grant database of over
          100 opportunities.
          <br />
          The database is updated every 48 hours to ensure the most accurate and active
          opportunities.
        </p>
      </div>
      <div className="w-[80%] lg:w-[95%] mx-auto my-6 flex flex-col lg:flex-row-reverse items-center lg:items-start gap-8 justify-center">
        <div className="flex flex-col gap-3 lg:sticky lg:top-[4.5rem]">
          <ChatbotContainer />
          <SubstackEmbed />
        </div>
        <div className="w-full">
          <div className="flex items-center pt-3 gap-5 font-medium text-white mb-0.5 border-b border-gray-600">
            <p className="relative">
              Search Grants Database
              <span className="w-full absolute bg-[#00bbfc] h-0.5 left-0 bottom-0"></span>
            </p>
          </div>
          <Board />
        </div>
      </div>
    </main>
  );
}
