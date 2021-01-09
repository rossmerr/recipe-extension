var scrapper = function () {
    let name,
        image,
        video,
        author,
        recipeCategory,
        recipeCuisine,
        yields,
        prepTime,
        cookTime,
        description;
    let recipeIngredient = recipeInstructions = [];

    let ld = document.querySelector('[type="application/ld+json"]');
    if (ld !== null) {
        let json = JSON.parse(ld.innerText)
        if (json !== undefined && json.length > 0) {
            json.forEach(function (recipe) {
                if (recipe['@type'] == 'Recipe') {
                    name = recipe.name;
                    image = recipe.image?.url;
                    video = recipe.video?.url;
                    author = recipe.author?.name;
                    recipeCategory = recipe.recipeCategory.join();
                    recipeCuisine = recipe.recipeCuisine.join();
                    yields = recipe.recipeYield;
                    prepTime = recipe.prepTime;
                    cookTime = recipe.cookTime;
                    description = recipe.description;
                    recipeIngredient = recipe.recipeIngredient;

                    recipe.recipeInstructions.forEach(function (e) {
                        recipeInstructions.push(e.text)
                    });
                }
            });
        }
    }

    let hasSchema = document.querySelector('[itemtype="http://schema.org/Recipe"]') !== null;
    if (hasSchema) {
        name = document.querySelector('[itemprop="name"]')?.textContent;
        image = document.querySelector('[itemprop="image"]')?.src;
        video = document.querySelector('[itemprop="video"]')?.src;
        author = document.querySelector('[itemprop="author"]')?.textContent;
        recipeCategory = document.querySelector('[itemprop="recipeCategory"]')?.textContent;
        recipeCuisine = document.querySelector('[itemprop="recipeCuisine"]')?.textContent;
        yields = document.querySelector('[itemprop="yield"]')?.textContent;
        prepTime = document.querySelector('[itemprop="prepTime"]')?.textContent;
        cookTime = document.querySelector('[itemprop="cookTime"]')?.textContent;
        description = document.querySelector('[itemprop="description"]')?.textContent;

        let recipeIngredientHtml = document.querySelectorAll('[itemprop="recipeIngredient"]');
        recipeIngredientHtml.forEach(function (e) {
            recipeIngredient.push(e.innerText)
        });

        let recipeInstructionsHtml = document.querySelectorAll('[itemprop="recipeInstructions"]');
        recipeInstructionsHtml.forEach(function (e) {
            recipeInstructions.push(e.innerText)
        });
    }

    let recipe = {
        name: name,
        image: image,
        video: video,
        author: author,
        recipeCategory: recipeCategory,
        recipeCuisine: recipeCuisine,
        yield: yields,
        prepTime: prepTime,
        cookTime: cookTime,
        recipeIngredient: recipeIngredient,
        recipeInstructions: recipeInstructions,
        description: description,
        url: window.location.href
    }
    if (hasSchema || ld !== null) {
        chrome.runtime.sendMessage({ action: "getRecipe", source: recipe });
    }
};