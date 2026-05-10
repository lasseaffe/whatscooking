import { notFound } from "next/navigation";
import Link from "next/link";
import { GUIDES, MilestoneRelevance } from "@/lib/guides-content";

const MILESTONE_LABELS: Record<MilestoneRelevance, string> = {
  pre_solids: "Pre-Solids",
  started_solids: "Started Solids",
  started_solids_to_soft_lumps: "Solids → Soft Lumps",
  handles_soft_lumps: "Soft Lumps",
  finger_foods: "Finger Foods",
  family_table: "Family Table",
  all_stages: "All Stages",
};

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const guide = GUIDES.find((g) => g.slug === params.slug);
  if (!guide) notFound();

  const paragraphs = guide.body.split(/\n\n+/).filter(Boolean);

  return (
    <>
      <style>{`
        .back-link {
          color: #8A6A4A;
          text-decoration: none;
          font-size: 13px;
          transition: color 0.2s;
        }
        .back-link:hover {
          color: #B07D56;
        }
      `}</style>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 48px" }}>
        {/* Back link */}
        <Link href="/family/guides" className="back-link">
          ← Back to Guides
        </Link>

        {/* Title */}
        <h1
          style={{
            fontFamily: "'Libre Baskerville', Georgia, serif",
            color: "#EFE3CE",
            fontSize: 26,
            fontWeight: 700,
            marginTop: 16,
            marginBottom: 12,
            lineHeight: 1.25,
          }}
        >
          {guide.title}
        </h1>

        {/* Milestone pill */}
        <span
          style={{
            display: "inline-block",
            background: "rgba(176,125,86,0.15)",
            border: "1px solid rgba(176,125,86,0.3)",
            color: "#B07D56",
            fontSize: 11,
            borderRadius: 20,
            padding: "2px 8px",
            marginBottom: 24,
          }}
        >
          {MILESTONE_LABELS[guide.milestoneRelevance]}
        </span>

        {/* Article body */}
        <div>
          {paragraphs.map((para, i) => (
            <p
              key={i}
              style={{
                color: "#C4A882",
                fontSize: 15,
                lineHeight: 1.7,
                marginTop: i === 0 ? 0 : 16,
                marginBottom: 0,
                whiteSpace: "pre-wrap",
              }}
            >
              {para}
            </p>
          ))}
        </div>
      </div>
    </>
  );
}
