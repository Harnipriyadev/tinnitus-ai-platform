export default function AboutAssessment() {
  return (
    <section
      id="about-assessment"
      className="bg-[#07121F] py-24"
    >
      <div className="mx-auto max-w-6xl px-8">

        <h2 className="mb-6 text-center text-5xl font-bold text-white">
          About The Assessment
        </h2>

        <p className="mx-auto mb-16 max-w-3xl text-center text-lg text-gray-400">
          Our AI-powered tinnitus assessment helps identify possible
          symptoms, evaluate risk levels, and provide personalized
          recommendations based on user responses.
        </p>

        <div className="grid gap-8 md:grid-cols-3">

          <div className="rounded-3xl border border-cyan-500/20 bg-white/5 p-8">
            <h3 className="mb-4 text-2xl font-semibold text-cyan-400">
              Step 1
            </h3>

            <p className="text-gray-300">
              Answer a series of tinnitus-related questions regarding
              hearing patterns, ringing intensity, sleep quality,
              and daily impact.
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-500/20 bg-white/5 p-8">
            <h3 className="mb-4 text-2xl font-semibold text-cyan-400">
              Step 2
            </h3>

            <p className="text-gray-300">
              Our AI model analyzes your responses and predicts
              potential tinnitus severity using intelligent
              healthcare analytics.
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-500/20 bg-white/5 p-8">
            <h3 className="mb-4 text-2xl font-semibold text-cyan-400">
              Step 3
            </h3>

            <p className="text-gray-300">
              Receive personalized recommendations, risk insights,
              and a downloadable report to help manage your condition.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}