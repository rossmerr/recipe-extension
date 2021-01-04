const save = document.getElementById('save');
var recipe;

chrome.runtime.onMessage.addListener(function (request, sender) {
    save.disabled = true;
    if (request.action == "getRecipe") {
        save.disabled = false;
        recipe = request.source;      
        let name = document.getElementById('name');
        name.textContent = recipe.name;
    }
});

chrome.tabs.query({
    active: true,
    currentWindow: true
}, tabs => {
    let s = `
        (function() {
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
                json.forEach(function(recipe) {
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
        
                        recipe.recipeInstructions.forEach(function(e) {
                            recipeInstructions.push(e.text)
                        });
                    }
                });
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
                recipeIngredientHtml.forEach(function(e) {
                    recipeIngredient.push(e.innerText)
                });

                let recipeInstructionsHtml = document.querySelectorAll('[itemprop="recipeInstructions"]');
                recipeInstructionsHtml.forEach(function(e) {
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
                chrome.runtime.sendMessage({action: "getRecipe", source: recipe});
            }
        })();
    `;

    chrome.tabs.executeScript(
        tabs[0].id, {
            code: s
        }
    );
});

save.addEventListener('click', function () {
    alert('click');
    let baseUrl = "https://api.github.com/repos";
    chrome.storage.local.get(function (data) {
        repo = data.repo;
        user = data.user;
        token = data.token;

        url = `${baseUrl}/${data.user}/${data.repo}/contents/content/recipes/${toPath(recipe.name)}/index.md`;
        let markdown = toMD();
        alert(markdown);
        let base64 = btoa(unescape(encodeURIComponent(markdown)));
        let sha = sha1(markdown);

        const request = new Request(url, {
            method: 'PUT'
        });
        let body =  `{"message": "test", "content": "${base64}", "sha": "${sha}"}`;
        request.body = body;
        request.headers.append("accept", "application/vnd.github.v3+json");
        request.headers.append("Authorization", "token " + data.token);

        busyToggle();

        fetch(request)
            .then(response => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return response.text().then(data => {
                        throw new Error('Something went wrong on api server!' + data);
                    });
                }
            })
            .then(response => {
                busyToggle();
            }).catch(error => {
                busyToggle();
                alert(error);
            });
    });
});

function busyToggle() {
    const save = document.getElementById('save');
    const spinner = document.getElementById('spinner');
    save.disabled = !save.disabled;
    spinner.classList.toggle("spinner");
}

function toPath(str) {
    let filename = str.toLowerCase();
    return filename.replaceAll(" ", "-");
}

function toBulletList(arr) {
    if (arr == undefined || arr.length == 0) {
        return "";
    }
    const separator = "- ";
    let s = separator + arr.join('\n' + separator);
    return s;
}

function toMD() {
    let date = new Date().toISOString();
    return `---
layout: recipe
date: ${date}
title: ${recipe.name || ""}
image: ${recipe.image  || ""}
YouTubeID:  ${recipe.video  || ""}
authorName: ${recipe.author || ""}
sourceURL: ${recipe.url || ""}
category: ${recipe.recipeCategory || ""} 
cuisine: ${recipe.recipeCuisine || ""}
yield: ${recipe.yield || ""}
prepTime: ${recipe.prepTime || ""}
cookTime: ${recipe.cookTime || ""}
directions:
${toBulletList(recipe.recipeInstructions)}
ingredients:
${toBulletList(recipe.recipeIngredient)}
---
${recipe.description || ""}
`;
}