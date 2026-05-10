from abc import ABC, abstractmethod


class BaseStrategy(ABC):
    """All pipeline strategies implement this interface.

    Orchestrator calls: recipes = []
    for raw in strategy.scrape():
        composed = strategy.compose([raw])
        if strategy.validate(composed):
            recipes.append(composed)
    """

    @abstractmethod
    def scrape(self) -> list[dict]:
        """Return a list of raw recipe dicts scraped from sources."""
        ...

    @abstractmethod
    def compose(self, raw: list[dict]) -> dict | None:
        """Take raw scraped recipes, return one composed recipe dict or None on failure."""
        ...

    @abstractmethod
    def validate(self, recipe: dict) -> bool:
        """Return True if recipe passes all field checks."""
        ...
