import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";

const FAQ = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-white border-white text-base">
          FAQ
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#151226] text-white/70 text-sm">
        <DialogTitle className="text-2xl text-white underline">
          Frequently Asked Questions
        </DialogTitle>
        <DialogDescription className="sr-only">
          Frequently asked questions about the project
        </DialogDescription>
        <ScrollArea className="max-h-[400px]">
          <div className="flex flex-col gap-4 text-start text-white pr-3">
            <div>
              <h3 className="text-lg font-semibold">Q. How can I navigate the database?</h3>
              <p className="text-sm text-white/70">
                You can filter grant opportunities by ecosystem, topics for funding, and active or
                upcoming opportunities. Make sure to scroll through the page to view all
                opportunities.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Q. How often is the database updated?</h3>
              <p className="text-sm text-white/70">
                The database is updated{" "}
                <span className="font-semibold text-slate-50"> every 48 hours</span> to ensure it
                contains the most accurate and active grant opportunities available.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">
                Q. Does this database show past/expired grant opportunities?
              </h3>
              <p className="text-sm text-white/70">
                No, this database is focused exclusively on showcasing{" "}
                <span className="font-semibold text-slate-50">ACTIVE</span> and{" "}
                <span className="font-semibold text-slate-50">UPCOMING</span> grant opportunities.
                We ensure its relevance by{" "}
                <span className="font-semibold text-slate-50">
                  regularly reviewing and updating the information
                </span>{" "}
                to keep it current.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">
                Q. Who do I contact if I have questions or find an error?
              </h3>
              <p className="text-sm text-white/70">
                If you have any questions, spot an error, or want to share feedback, feel free to
                reach out to us at{" "}
                <a href="mailto:marianna@cornarolabs.xyz" className="text-blue-500">
                  marianna@cornarolabs.xyz
                </a>
                . We’re here to help and appreciate your input to make this resource even better!
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">
                Q. Can I add a new grant program to the database?
              </h3>
              <p className="text-sm text-white/70">
                Absolutely! If you’re aware of an active or upcoming Web3 grant program that isn’t
                listed here, we’d love to hear about it. Please{" "}
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSewB2GaJXyWY5m1de5zw-vnP4KotEtHu6sujaDWP9tWaoAquw/viewform"
                  target="_blank"
                  className="text-blue-500 hover:underline">
                  fill in this form{" "}
                </a>{" "}
                or email us the details at{" "}
                <a href="mailto:marianna@cornarolabs.xyz" className="text-blue-500">
                  marianna@cornarolabs.xyz
                </a>
                , and we’ll review and add it to the database.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">
                Q. Is this the final version of the dashboard?
              </h3>
              <p className="text-sm text-white/70">
                Not at all! This is just version 1 of what we are building—simple yet functional.
                Stay tuned for a more advanced version{" "}
                <span className="font-semibold text-slate-50">
                  that will include additional features and improvements such as the AI-powered
                  Grant Matching and the Data-Driven Grant Analytics features.
                </span>
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Q. Is this dashboard free to use?</h3>
              <p className="text-sm text-white/70">
                CL Web3 Grants offers core features such as the grants database and AI-powered
                matching tool for free, with premium services available for those needing deeper
                support. This two-tier model ensures broad access to valuable knowledge while
                providing advanced strategic guidance and resources to drive decentralization and
                innovation. For projects seeking hands-on support, Cornaro Labs provides expert
                consulting services to help Web3 teams secure funding, navigate grant opportunities,
                and optimize their applications.{" "}
                <a
                  href="https://calendly.com/cornarolabs"
                  target="_blank"
                  className="text-blue-500 hover:underline">
                  Book your free consultation today!
                </a>
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Q. Are there any other free resources?</h3>
              <p className="text-sm text-white/70">
                Yes! You may subscribe to our newsletter,{" "}
                <a
                  href="https://cornarolabs.substack.com"
                  target="_blank"
                  className="text-blue-500 hover:underline">
                  CL Web3 Grants
                </a>
                , featuring curated grant opportunities for Web3 projects. In{" "}
                <a
                  href="https://cornarolabs.substack.com"
                  target="_blank"
                  className="text-blue-500 hover:underline">
                  CL Web3 Grants
                </a>
                , you’ll find new grant opportunities, insider tips for writing winning
                applications, pitch competitions, and events to elevate your Web3 journey.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FAQ;
