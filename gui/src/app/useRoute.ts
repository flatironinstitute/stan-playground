import { useCallback, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { JSONStringifyDeterministic } from "./FromJpfiddle/LeftPanel"

export type Route = {
    page: 'home'
    fiddleUri?: string
    title?: string
} | {
    page: 'about'
}

const useRoute = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const search = location.search
    const query = useMemo(() => (parseSearchString(search)), [search])
    const p = query.p || '/'
    const route: Route = useMemo(() => {
        if (p === '/about') {
            return {
                page: 'about'
            }
        }
        else {
            const fiddleUri = getFiddleUriFromQuery(query)
            return {
                page: 'home',
                fiddleUri,
                title: decodeURIComponent((query.t || '') as string)
            }
        }
    }, [p, query])

    const setRoute = useCallback((r: Route, replaceHistory?: boolean) => {
        let newQuery: {[key: string]: string | string[]} = {...query}
        if (r.page === 'home') {
            newQuery = {
                p: '/',
                t: encodeURIComponent(r.title || '')
            }
            if (r.fiddleUri?.startsWith('{')) {
                // special internal fiddleUri that is a json string
                const fiddleUriObject = JSON.parse(r.fiddleUri)
                newQuery = {
                    ...newQuery,
                    ...fiddleUriObject
                }
            }
            else {
                newQuery = {
                    ...newQuery,
                    f: r.fiddleUri || ''
                }
            }
        }
        else if (r.page === 'about') {
            newQuery = {p: '/about'}
        }
        const newSearch = queryToQueryString(newQuery)
        navigate(location.pathname + newSearch, {replace: replaceHistory})
    }, [navigate, location.pathname, query])

    return {
        route,
        setRoute
    }
}

const parseSearchString = (search: string) => {
    const query: { [key: string]: string | string[] } = {}
    const a = search.slice(1).split('&')
    for (const s of a) {
        const b = s.split('=')
        const key = b[0]
        const value = b[1]
        if ((key in query) && (query[key])) {
            if (Array.isArray(query[key])) {
                (query[key] as string[]).push(value)
            }
            else if (typeof query[key] === 'string') {
                query[key] = [query[key] as string, value]
            }
            else {
                console.warn('Unexpected query[key] type in parseSearchString', typeof query[key])
            }
        }
        else {
            query[key] = value
        }
    }
    return query
}

const queryToQueryString = (query: { [key: string]: string | string[] }) => {
    const a: string[] = []
    for (const key in query) {
        if (query[key]) {
            if (Array.isArray(query[key])) {
                for (const value of (query[key] as string[])) {
                    a.push(`${key}=${value}`)
                }
            }
            else if (typeof query[key] === 'string') {
                a.push(`${key}=${query[key]}`)
            }
            else {
                console.warn('Unexpected query[key] type in queryToQueryString', typeof query[key])
            }
        }
    }
    return '?' + a.join('&')
}

const getFiddleUriFromQuery = (query: { [key: string]: string | string[] }) => {
    if (query.f) {
        return query.f as string
    }
    else if (query['main.stan']) {
        // special internal fiddleUri that is a json string
        const ret: { [key: string]: string } = {}
        ret['main.stan'] = query['main.stan'] as string
        if (query['data.json']) {
            ret['data.json'] = query['data.json'] as string
        }
        if (query['opts.json']) {
            ret['opts.json'] = query['opts.json'] as string
        }
        if (query['main.py']) {
            ret['main.py'] = query['main.py'] as string
        }
        return JSONStringifyDeterministic(ret)
    }
}

export default useRoute