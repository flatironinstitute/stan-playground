import { useCallback, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

export type Route = {
    page: 'home'
    sourceDataUri: string
    title: string
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
        if (typeof p !== 'string') {
            console.warn('Unexpected type for p', typeof p)
            return {
                page: 'home',
                sourceDataUri: '',
                title: ''
            }
        }
        if (p === '/about') {
            return {
                page: 'about'
            }
        }
        else {
            return {
                page: 'home',
                sourceDataUri: p,
                title:  decodeURI((query.t || '') as string)
            }
        }
    }, [p, query])

    const setRoute = useCallback((r: Route, replaceHistory?: boolean) => {
        let newQuery = {...query}
        if (r.page === 'home') {
            newQuery = {p: '/', t: encodeURI(r.title)}
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

export default useRoute