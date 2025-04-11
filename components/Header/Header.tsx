import AboutUs from "./AboutUs";
import FAQ from "./FAQ";

const Header = () => {
  return (
    <header className="px-6 py-3 backdrop-blur-md bg-[#151226]/35 text-white fixed w-full z-10 shadow border-b border-gray-600 rounded-b-3xl">
      <nav className="flex flex-col md:flex-row justify-between items-center">
        <div className="w-72 lg:w-52">
          <a href="https://www.cornarolabs.xyz" target="_blank" rel="noreferrer">
            <img src="./logo.png" alt="" />
          </a>
        </div>
        <div className="flex gap-1 md:gap-4 items-center">
          <AboutUs />
          <FAQ />
          <a
            href="https://tally.so/r/nPGzAb"
            target="_blank"
            rel="noreferrer"
            className="text-white px-2 md:px-4 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors font-semibold">
            Add Grant
          </a>
        </div>
      </nav>
    </header>
  );
};
export default Header;
