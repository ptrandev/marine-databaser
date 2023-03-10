import { useEffect } from "react";

interface useEffectDebounced {
    (effect: () => void, deps: any[], delay: number): void;
}

export const useEffectDebounced : useEffectDebounced = (effect, deps, delay) => {
    useEffect(() => {
        const handler = setTimeout(() => effect(), delay);

        return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...(deps || []), delay]);
}