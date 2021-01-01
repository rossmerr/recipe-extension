chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.sync.get(function (data) {
        repo = data.repo;
        user = data.user;
        token = data.token;
        chrome.storage.local.set({
            repo: repo,
            token: token,
            user: user
        }, function () {});
    });

    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {

        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                // pageUrl: {
                //     hostEquals: 'developer.chrome.com'
                // },
            })],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});

