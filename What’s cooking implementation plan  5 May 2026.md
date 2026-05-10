What’s cooking implementation plan  
 5 May 2026

 

Recipes

Meal swiper

Not mobile compatible yet, because I can’t swipe far enough to make next recipe appear, fix that for mobile, desktop is running fine.

World cuisine

Needs to be expanded by EVERY country listed in world cup.  
 This file ("C:\\Users\\lasse\\Desktop\\whatscooking\\worldcup\_10\_recipes\_each\_country.md")  
  lists 10 recipes for each country, I feel like they are not yet included, but that might be because of the faulty path structure.

 

Instructions

**improve mobile compatibility**

"C:\\Users\\lasse\\Pictures\\Screenshots\\Screenshot 2026-05-05 012626.png"

\-recipe image appears on top, between the recipe title/description and cooking time,how many served (the  \+/- button to adjust ingredient amounts, should be directly below the entry of how many portions recipe serves and not separately in ingredients as it is now) calories.  
 make the breakdown points of what steps take how long (in image prep 15min, mix & whisk 4min (…) take up less space on mobile and also make the different colors more compatible with the branding.  
 The start cooking mode needs to stay sticky until scrolling down to comments, then it “goes back” to its place.  
 My vision here is to have the cta for starting cooking on centre-bottom of page (sticky/moves with scrolling) so its not hidden.

 "C:\\Users\\lasse\\Pictures\\Screenshots\\Screenshot 2026-05-05 013445.png"

See how crammed it is, think of how you can make it mobile compatible.  
 the instructions could be shown below ingredients when scrolling down, so they don’t have to be next to each other.  
 Also let me click through different phases regardless. I want to be able to jump straight to phase IV serve if I click it and back to III cook when I click it, and so on.

The “sos helper” should be renamed to something thematically fitting (chef’s assistant wouldn’t fit the deeper theme, its more like a guru or something. Think about it)  
 then remove this cta button ("C:\\Users\\lasse\\Pictures\\Screenshots\\Screenshot 2026-05-05 013902.png") as it is redundant anyway.  
 Add the hover description to the button in instructions/cooking mode that is currently only in the one I screenshotted.

World cup

Some countries when clicked lead to a 404 error for example:  
 http://localhost:3002/cuisines/american

Be mindful to fix that for every single country (meaning that these pages also show all the recipes), so that they all adhere to the same path logic of  
 /cuisines/American/**USA**  
 (always sort continent/country)

All recipes

Clicking on all recipes lands me on [http://localhost:3002/recipes](http://localhost:3002/recipes) but this has 0 entries, this should show ALL recipes, then filtered if so selected.

 The filter category for “utensils” is not showing, even though I told you to work on it.  
 add it and also make it functional.  
 The vision is to let me filter for utensils, lets say I don’t have a pot at home, let me filter/adapt (like with dietary restrictions) for utensils as well.  
 This should work positively (recipe USES that utensil) and negatively (recipe DOESN’T use utensil/selected utensil is being substituted by “adapt”

 

Meal plans

Meal planner seems to have 2 branching systems, 1 when working from template ("C:\\Users\\lasse\\Pictures\\Screenshots\\Screenshot 2026-05-05 003059.png") this is the look I prefer.  
 And when clicking on existing or startng from scratch it shows up like a list view instead of grid. ("C:\\Users\\lasse\\Pictures\\Screenshots\\Screenshot 2026-05-05 003209.png")

 I want the grid to be the standard and to use these card style list view as a separate “view option” and on the same page, similar how the recipe view options work.  
 The grid view is always standard.  
 The grid view has some more problems, it doesn’t show the add a meal function, macro breakdown, calendar instead of just weekdays and so on – check with last worked on from log, because you implemented that in the section when creating anew or editing.

 Again these 2 now separate pages are being merged into one, switchable by view button.

 Diverging from this come some problems.  
 the drag and drop for every card doesn’t work yet, the big card (the one picture in file below in “meal bank” isn’t drag and droppable yet.  
 "C:\\Users\\lasse\\Pictures\\Screenshots\\Screenshot 2026-05-05 003405.png"  
 Keep in mind to fix this for both views.

 the grid view ("C:\\Users\\lasse\\Pictures\\Screenshots\\Screenshot 2026-05-05 003929.png") should let me add meal by typing when I click on the \+ on empty cards (in the image snack is empty for example, when I click on it show recipes for that category in this case desserts.

 users should be able to add rows (extra meals) and columns (extra days/weeks)  
 When adding new meal make it optional to give it a category (like dessert/snack/appetizer) but also let it work when empty. Then instead of suggestions like previously mentioned with desserts, just show all recipes.

 Additionally, think about more enhancements and optimizations for this meal planner.  
 I think something for meal prepping would be cool. Search for ideas regarding that, but also beyond just that.

Dinner & events

 

Nutrient tracker

 

My pantry

Fix design according to other design for this ("C:\\Users\\lasse\\Pictures\\Screenshots\\Screenshot 2026-05-05 011006.png")  
 and this ("C:\\Users\\lasse\\Pictures\\Screenshots\\Screenshot 2026-05-05 011049.png")

 Add a “shared pantry/storage” function that lets users collaborate on the same pantry.  
 Idea is that I can share this with my girlfriend and we both access the same lists so we can each see the status of letftover meals and the ingredients at home and so on.

Ux-ui

New Sidebar category order.

 discover  
 \-meal swipe  
 \-world cuisines  
             	\+fusion foods  
             	\+world cup 2026  
 \-all recipes

 (leave the rest as is for now)

 

Remove these dark grey rectangles  
 "C:\\Users\\lasse\\Pictures\\Screenshots\\Screenshot 2026-05-05 005952.png"

 

 

Right now the pages  
 localhost:3002  
 localhost:3002/discover  
 localhost:3002/dashboard

 fulfill pretty much the same purpose.

 Think about how you can merge these a little bit into just 2 pages.  
 localhost:3002 remains main page and landing page with hero video background and below that it should show contents of dashboard.  
 localhost:3002/discover should include  
 \-meal swipe  
 \-world cuisines  
             	\+fusion foods  
             	\+world cup 2026  
 \-all recipes

 (meal swipe should move from having its own page to being embedded on discover)

 

 

