import { EmailBox } from "@/components/email-box";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#044cab] to-[#0367d3] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          One Time Mail
          </h1>
          <p className="text-blue-100 text-lg">
            Generate disposable email addresses instantly. No registration required.
          </p>
        </div>
        <EmailBox />
      </div>
    </main>
  );
}