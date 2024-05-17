export type SharedUrlHistory = {
    title: string,
    url: string
}[]

type SharedUrlHistoryAction = {
    type: 'add'
    title: string
    url: string
}

const maxUrlsInHistory = 20;

export const SharedUrlHistoryReducer = (state: SharedUrlHistory, action: SharedUrlHistoryAction): SharedUrlHistory => {
    switch (action.type) {
        case 'add': {
            const newState = [...state].filter(x => x.url !== action.url);
            newState.unshift({ title: action.title, url: action.url });
            return newState.slice(0, maxUrlsInHistory);
        }
    }
}