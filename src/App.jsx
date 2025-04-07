import Board from "./components/Board";
import Header from "./components/Header/Header";
import ChatbotContainer from "./components/ChatBot/ChatbotContainer";
import SubstackEmbed from "./components/SubstackEmbed";

function App() {
  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-center pt-40 lg:pt-32 pb-5">
        <div className="flex flex-col items-center space-y-4">
          <h1 className="text-4xl font-medium text-center">CL Web3 Grants Dashboard</h1>
          <p className="text-[#ffffff7a] max-w-[55rem] text-center px-4">
            A public good initiative empowering Web3 projects through a dynamic grant database of
            over 100 opportunities.
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
      <footer className="flex flex-col items-center space-y-2 pb-8">
        <div className="flex flex-col justify-center items-center mb-1 gap-2">
          <a href="https://www.cornarolabs.xyz" target="_blank" rel="noreferrer">
            <img src="./logo.png" alt="" className="w-[14.625rem]" />
          </a>
          <div>
            <p className="text-white text-sm text-center">
              CL Web3 Grants Dashboard by{" "}
              <a
                href="http://www.cornarolabs.xyz"
                target="_blank"
                className="text-blue-500 hover:underline">
                Cornaro Labs
              </a>{" "}
              is built in collaboration with:
            </p>
            <div className="flex gap-2 items-center px-2">
              <a href="https://www.blackvogel.com/" target="_blank" rel="noreferrer">
                <img src="./logo2.svg" alt="" className="w-52" />
              </a>
              <a href="https://hbi.gr/en/" target="_blank" rel="noreferrer">
                <img src="./logo3.jpeg" alt="" className="w-52" />
              </a>
            </div>
          </div>
        </div>
        <div>
          <p className="flex flex-col items-center space-y-2 mt-4 text-[#ffffff7a]/20 text-xs text-center">
            <span>© Cornaro Labs 2025. All rights reserved.</span> For inquiries, please reach out
            to us at info@cornarolabs.xyz
          </p>
        </div>
      </footer>
    </>
  );
}

export default App;
