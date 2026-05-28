import type { CuisineInfo } from "@/lib/cuisines";

interface Props {
  cuisine: CuisineInfo;
  wikiExtract?: string;
  wikiSource?: string;
}

/**
 * HeritageAtlasSection — purely presentational.
 * Renders cultural heritage data for an enriched cuisine.
 * Returns null when no heritage fields are present.
 * wikiExtract/wikiSource props take precedence over cuisine.historyExtract/historySource.
 */
export function HeritageAtlasSection({ cuisine, wikiExtract, wikiSource }: Props) {
  const {
    stapleIngredients,
    coreTechniques,
    culturalOccasions,
    crossCultureBridges,
    color,
  } = cuisine;

  const extract = wikiExtract ?? cuisine.historyExtract;
  const source = wikiSource ?? cuisine.historySource;

  const hasContent =
    extract ||
    (stapleIngredients && stapleIngredients.length > 0) ||
    (coreTechniques && coreTechniques.length > 0) ||
    (culturalOccasions && culturalOccasions.length > 0) ||
    (crossCultureBridges && crossCultureBridges.length > 0);

  if (!hasContent) return null;

  const accent = color ?? "#6B7280";

  return (
    <section
      className="heritage-atlas"
      aria-label={`${cuisine.name} cultural heritage`}
      style={{ "--heritage-accent": accent } as React.CSSProperties}
    >
      {/* History extract */}
      {extract && (
        <div className="heritage-atlas__history">
          <h3 className="heritage-atlas__heading">History</h3>
          <p className="heritage-atlas__extract">{extract}</p>
          {source && (
            <a
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              className="heritage-atlas__source"
            >
              Source: Wikipedia
            </a>
          )}
        </div>
      )}

      {/* Staple ingredients */}
      {stapleIngredients && stapleIngredients.length > 0 && (
        <div className="heritage-atlas__block">
          <h3 className="heritage-atlas__heading">Staple Ingredients</h3>
          <ul className="heritage-atlas__item-list">
            {stapleIngredients.map((item) => (
              <li key={item.name} className="heritage-atlas__item">
                <span className="heritage-atlas__item-emoji" aria-hidden>
                  {item.emoji}
                </span>
                <span className="heritage-atlas__item-name">{item.name}</span>
                <span className="heritage-atlas__item-note">{item.note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Core techniques */}
      {coreTechniques && coreTechniques.length > 0 && (
        <div className="heritage-atlas__block">
          <h3 className="heritage-atlas__heading">Core Techniques</h3>
          <ul className="heritage-atlas__item-list">
            {coreTechniques.map((item) => (
              <li key={item.name} className="heritage-atlas__item">
                <span className="heritage-atlas__item-emoji" aria-hidden>
                  {item.emoji}
                </span>
                <span className="heritage-atlas__item-name">{item.name}</span>
                <span className="heritage-atlas__item-note">{item.note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cultural occasions */}
      {culturalOccasions && culturalOccasions.length > 0 && (
        <div className="heritage-atlas__block">
          <h3 className="heritage-atlas__heading">Cultural Occasions</h3>
          <ul className="heritage-atlas__occasions">
            {culturalOccasions.map((occasion) => (
              <li key={occasion} className="heritage-atlas__occasion">
                {occasion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cross-culture bridges */}
      {crossCultureBridges && crossCultureBridges.length > 0 && (
        <div className="heritage-atlas__block">
          <h3 className="heritage-atlas__heading">Cross-Culture Bridges</h3>
          <ul className="heritage-atlas__bridges">
            {crossCultureBridges.map((bridge) => (
              <li key={bridge.dish} className="heritage-atlas__bridge">
                <div className="heritage-atlas__bridge-header">
                  <span className="heritage-atlas__bridge-dish">{bridge.dish}</span>
                  <span className="heritage-atlas__bridge-from">{bridge.from}</span>
                </div>
                <p className="heritage-atlas__bridge-story">{bridge.story}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
