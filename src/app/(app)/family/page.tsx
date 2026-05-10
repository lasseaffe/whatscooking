import Link from "next/link";
import { Users, ChefHat, BookOpen, Calendar, ChevronRight } from "lucide-react";

const cards = [
  {
    href: "/family/members",
    icon: Users,
    title: "Family Members",
    description:
      "Track milestones, allergen introductions, and feeding stages for each little one",
  },
  {
    href: "/family/recipes",
    icon: ChefHat,
    title: "Baby Recipes",
    description:
      "Age-appropriate recipes filtered by your baby's current stage and safe allergens",
  },
  {
    href: "/family/guides",
    icon: BookOpen,
    title: "Feeding Guides",
    description:
      "Expert guidance on starting solids, introducing allergens, and growing through food stages",
  },
  {
    href: "/plans",
    icon: Calendar,
    title: "Family Meal Planner",
    description:
      "Plan meals for the whole family with baby variants auto-suggested alongside adult recipes",
  },
];

export default function FamilyHubPage() {
  return (
    <>
      <style>{`
        .family-hub-card {
          display: block;
          background: #1A1008;
          border: 1px solid #3A2416;
          border-radius: 12px;
          padding: 20px;
          text-decoration: none;
          transition: border-color 0.2s;
          position: relative;
        }
        .family-hub-card:hover {
          border-color: #5F3E2D;
        }
      `}</style>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 48px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
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
            Family Hub
          </h1>
          <p style={{ color: "#8A6A4A", fontSize: 15, marginTop: 6, marginBottom: 0 }}>
            Everything your growing family needs at the table
          </p>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 16 }}>
          {cards.map(({ href, icon: Icon, title, description }) => (
            <Link key={href} href={href} className="family-hub-card">
              {/* Icon container */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #B07D56, #5F3E2D)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={20} color="#FFFFFF" />
              </div>

              <p
                style={{
                  fontFamily: "'Libre Baskerville', Georgia, serif",
                  color: "#EFE3CE",
                  fontSize: 16,
                  fontWeight: 700,
                  marginTop: 12,
                  marginBottom: 0,
                }}
              >
                {title}
              </p>

              <p
                style={{
                  color: "#8A6A4A",
                  fontSize: 13,
                  lineHeight: 1.5,
                  marginTop: 6,
                  marginBottom: 0,
                  paddingRight: 24,
                }}
              >
                {description}
              </p>

              <div style={{ position: "absolute", bottom: 16, right: 16, color: "#6B4E36" }}>
                <ChevronRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
