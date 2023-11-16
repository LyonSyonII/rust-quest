export function onThemeChange(callback: (theme: "dark" | "light") => void): MutationObserver {
    const target = document.documentElement;
    const config = { attributes: true };

    const c: MutationCallback = (mutationList, _) => {
        for (const mutation of mutationList) {
            if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
                callback(target.dataset.theme as "dark" | "light");
            }
        }
    }
    const observer = new MutationObserver(c);
    observer.observe(target, config);
    return observer
}