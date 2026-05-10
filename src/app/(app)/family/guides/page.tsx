import Link from "next/link";
import { ChevronRight } from "lucide-react";
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

export default function GuidesIndexPage() {
  return (
    <>
      <style>{`
        .guide-card {
          display: block;
          background: #1A1008;
          border: 1px solid #3A2416;
          border-radius: 10px;
          padding: 16px;
          text-decoration: none;
          transition: border-color 0.2s;
          position: relative;
        }
        .guide-card:hover {
          border-color: #5F3E2D;
        }
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
        {/* Back */}
        <Link href="/family" className="back-link">
          ← Back to Family Hub
        </Link>

        {/* Header */}
        <div style={{ marginTop: 16, marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: "'Libre Baskerville', Georgia, serif",
              color: "#EFE3CE",
              fontSize: 30,
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Feeding Guides
          </h1>
          <p style={{ color: "#8A6A4A", fontSize: 15, marginTop: 6, marginBottom: 0 }}>
            Science-backed guidance for every stage of your baby&apos;s food journey
          </p>
        </div>

        {/* Guide cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {GUIDES.map((guide) => (
            <Link key={guide.slug} href={`/family/guides/${guide.slug}`} className="guide-card">
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
                  marginBottom: 8,
                }}
              >
                {MILESTONE_LABELS[guide.milestoneRelevance]}
              </span>

              {/* Title */}
              <p
                style={{
                  fontFamily: "'Libre Baskerville', Georgia, serif",
                  color: "#EFE3CE",
                  fontSize: 15,
                  fontWeight: 700,
                  margin: 0,
                  paddingRight: 28,
                }}
              >
                {guide.title}
              </p>

              {/* Summary */}
              <p
                style={{
                  color: "#8A6A4A",
                  fontSize: 13,
                  marginTop: 4,
                  marginBottom: 0,
                  lineHeight: 1.5,
                  paddingRight: 28,
                }}
              >
                {guide.summary}
              </p>

              {/* Chevron */}
              <div style={{ position: "absolute", top: "50%", right: 16, transform: "translateY(-50%)", color: "#6B4E36" }}>
                <ChevronRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
