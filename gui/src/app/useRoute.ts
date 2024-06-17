import { useCallback, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { SamplingOpts, defaultSamplingOpts } from "./StanSampler/StanSampler"

export type Route = {
    page: 'home'
    sourceDataQuery?: {
        stan?: string
        data?: string
        sampling_opts?: string
        inline_sampling_opts?: SamplingOpts
        title?: string
    }
} | {
    page: 'prototypes'
}

const useRoute = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const search = location.search
    const query = useMemo(() => (parseSearchString(search)), [search])
    const route: Route = useMemo(() => {
        if (query.page === 'prototypes') {
            return { page: 'prototypes' }
        }
        const recognizedQueryKeys = new Set([
            'stan',
            'data',
            'sampling_opts',
            'num_chains',
            'num_warmup',
            'num_samples',
            'init_radius',
            'seed',
            'title'
        ])
        const hasAQueryKey = Object.keys(query).some(key => recognizedQueryKeys.has(key))
        if (hasAQueryKey) {
            try {
                const inlineSamplingOpts = {...defaultSamplingOpts}
                let hasAnInlineSamplingOpt = false
                if (query.num_chains) {
                    inlineSamplingOpts.num_chains = parseInt(query.num_chains as string)
                    hasAnInlineSamplingOpt = true
                }
                if (query.num_warmup) {
                    inlineSamplingOpts.num_warmup = parseInt(query.num_warmup as string)
                    hasAnInlineSamplingOpt = true
                }
                if (query.num_samples) {
                    inlineSamplingOpts.num_samples = parseInt(query.num_samples as string)
                    hasAnInlineSamplingOpt = true
                }
                if (query.init_radius) {
                    inlineSamplingOpts.init_radius = parseFloat(query.init_radius as string)
                    hasAnInlineSamplingOpt = true
                }
                if (query.seed) {
                    inlineSamplingOpts.seed = parseInt(query.seed as string)
                    hasAnInlineSamplingOpt = true
                }
                return {
                    page: 'home',
                    sourceDataQuery: {
                        stan: query.stan as string,
                        data: query.data as string,
                        sampling_opts: query.sampling_opts as string,
                        inline_sampling_opts: hasAnInlineSamplingOpt ? inlineSamplingOpts : undefined,
                        title: query.title as string
                    }
                }
            }
            catch (e) {
                console.error('Error parsing query', e)
                return { page: 'home' }
            }
        }
        else {
            return { page: 'home' }
        }
    }, [query])

    const setRoute = useCallback((r: Route, replaceHistory?: boolean) => {
        let newQuery: { [key: string]: string | undefined } | undefined = undefined
        if (r.page === 'prototypes') {
            navigate(location.pathname + '?page=prototypes', {replace: replaceHistory})
            return
        }
        if (r.page != 'home') {
            console.error('Unexpected page in setRoute', (r as any).page)
            return
        }
        if (r.sourceDataQuery) {
            const hasInlineSamplingOpts = !!r.sourceDataQuery.inline_sampling_opts
            newQuery = {
                stan: r.sourceDataQuery.stan,
                data: r.sourceDataQuery.data,
                sampling_opts: r.sourceDataQuery.sampling_opts,
                num_chains: hasInlineSamplingOpts ? r.sourceDataQuery.inline_sampling_opts?.num_chains.toString() : undefined,
                num_warmup: hasInlineSamplingOpts ? r.sourceDataQuery.inline_sampling_opts?.num_warmup.toString() : undefined,
                num_samples: hasInlineSamplingOpts ? r.sourceDataQuery.inline_sampling_opts?.num_samples.toString() : undefined,
                init_radius: hasInlineSamplingOpts ? r.sourceDataQuery.inline_sampling_opts?.init_radius.toString() : undefined,
                seed: hasInlineSamplingOpts ? (r.sourceDataQuery.inline_sampling_opts?.seed !== undefined ? r.sourceDataQuery.inline_sampling_opts?.seed?.toString() : undefined) : undefined,
                title: r.sourceDataQuery.title
            }
            // remove null-ish values
            for (const key in newQuery) {
                if (!newQuery[key]) {
                    delete newQuery[key]
                }
            }
        }
        else {
            newQuery = {}
        }

        const newSearch = queryToQueryString(newQuery)
        navigate(location.pathname + newSearch, {replace: replaceHistory})
    }, [navigate, location.pathname])

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

const queryToQueryString = (query: { [key: string]: string | string[] | undefined }) => {
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