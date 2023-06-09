import { FunctionComponent, useCallback, useEffect, useState } from "react";
import { useGithubAuth } from "../../../GithubAuth/useGithubAuth";
import Markdown from "../../../Markdown/Markdown";
import { useProject } from "../ProjectPageContext";

type Props = {
    width: number
    height: number
    stanFileName: string
    textHasBeenEdited: boolean
}

const defaultPrompt = `Describe this model in detail.`

const StanFileChatGPTWindow: FunctionComponent<Props> = ({width, height, stanFileName, textHasBeenEdited}) => {
    const {askAboutStanProgram} = useProject()
    const [prompt, setPrompt] = useState(defaultPrompt)
    const [response, setResponse] = useState('')
    const [cumulativeTokensUsed, setCumulativeTokensUsed] = useState<number | undefined>(undefined)
    const [processing, setProcessing] = useState(false)

    const {userId} = useGithubAuth()

    useEffect(() => {
        let canceled = false
        ;(async () => {
            const opts = {
                useCache: true,
                cacheOnly: true,
                force: false
            }
            const {response} = await askAboutStanProgram(stanFileName, defaultPrompt, opts)
            if (canceled) return
            if (response) {
                setResponse(response)
            }
        })()
        return () => {canceled = true}
    }, [askAboutStanProgram, stanFileName])

    const handleSubmit = useCallback(async () => {
        if (processing) return
        setProcessing(true)
        try {
            const opts = {
                useCache: true,
                cacheOnly: false,
                force: true
            }
            const {response, cumulativeTokensUsed} = await askAboutStanProgram(stanFileName, prompt, opts)
            setResponse(response)
            if (cumulativeTokensUsed) {
                setCumulativeTokensUsed(cumulativeTokensUsed)
            }
        }
        finally {
            setProcessing(false)
        }
    }, [askAboutStanProgram, stanFileName, prompt, processing])

    return (
        <div style={{width: width, height: height, backgroundColor: 'white'}}>
            <div style={{height: 30, backgroundColor: 'lightgray'}}>
                <div style={{padding: 5, fontWeight: 'bold'}}>Ask ChatGPT about this Stan program</div>
            </div>
            <div style={{height: height - 30, backgroundColor: 'white'}}>
                <div style={{padding: 5}}>
                    <div style={{padding: 5}}>
                        <div style={{fontWeight: 'bold'}}>Prompt</div>
                        <textarea
                            style={{width: '100%', height: 100}}
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                        />
                    </div>

                    {
                        !userId && (
                            <div style={{padding: 5}}>
                                <div style={{fontWeight: 'bold', color: 'gray'}}>You must be logged in to use ChatGPT</div>
                            </div>
                        )
                    }

                    {/* Submit button */}
                    <div style={{padding: 5}}>
                        <button onClick={handleSubmit} disabled={(!userId) || (processing) || textHasBeenEdited}>Submit</button>
                        {
                            userId && !processing && textHasBeenEdited && (
                                <div style={{color: 'gray'}}>You must save your changes before submitting to ChatGPT.</div>
                            )
                        }
                    </div>

                    <div style={{padding: 5}}>
                        <div style={{fontWeight: 'bold'}}>Response</div>
                        <div>
                            {
                                processing ? (
                                    <div>Processing...</div>
                                ) : (
                                    <Markdown source={response} />
                                )
                            }
                        </div>
                    </div>

                    {
                        cumulativeTokensUsed !== undefined && (
                            <div style={{padding: 5, color: '#aaa'}}>
                                <div style={{fontWeight: 'bold'}}>Cumulative tokens used for {userId}</div>
                                <div>{(cumulativeTokensUsed / 1e3).toFixed(1)}k / 200k</div>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )
}

export default StanFileChatGPTWindow