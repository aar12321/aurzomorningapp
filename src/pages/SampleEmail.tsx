import { buildDailyEmailHtml } from "@/integrations/email/resend";

const SampleEmail = () => {
  const html = buildDailyEmailHtml("Aaryan", [
    { topic: "Math – Algebra", day: 4, url: "/quiz/algebra/4" },
    { topic: "Science – Biology", day: 2, url: "/quiz/biology/2" },
    { topic: "Financial Literacy", day: 3, url: "/quiz/financial/3" },
    { topic: "English", day: 5, url: "/quiz/english/5" },
    { topic: "AI & Tech", day: 1, url: "/quiz/ai/1" },
  ]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div
        className="max-w-3xl mx-auto bg-card text-card-foreground shadow rounded-xl p-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

export default SampleEmail;
