import { FunctionComponent, useEffect, useMemo, useState } from "react";
import StanFileEditor from "../../FileEditor/StanFileEditor";
import { Splitter } from "@fi-sci/splitter";
import DataFileEditor from "../../FileEditor/DataFileEditor";
import RunPanel from "../../RunPanel/RunPanel";
import StanModel from "../../tinystan/StanModel";

type Props = {
    width: number
    height: number
}

const initialFileContent = localStorage.getItem('main.stan3') || `
data {
  int<lower=0> N;
  vector[N] x;
  vector[N] y;
}
parameters {
  real alpha;
  real beta;
  real<lower=0> sigma;
}
model {
  y ~ normal(alpha + beta * x, sigma);
}
`.trim() + '\n'

const initialDataFileContent = localStorage.getItem('data.json') || `
{
  "N": 5,
  "x": [1, 2, 3, 4, 5],
  "y": [1, 2, 3, 4, 5]
}
`.trim() + '\n'

const HomePage: FunctionComponent<Props> = ({width, height}) => {
    const [fileContent, saveFileContent] = useState(initialFileContent)
    const [editedFileContent, setEditedFileContent] = useState('')
    useEffect(() => {
        setEditedFileContent(fileContent)
    }, [fileContent])
    useEffect(() => {
        localStorage.setItem('main.stan', fileContent)
    }, [fileContent])

    const [dataFileContent, saveDataFileContent] = useState(initialDataFileContent)
    const [editedDataFileContent, setEditedDataFileContent] = useState('')
    useEffect(() => {
        setEditedDataFileContent(dataFileContent)
    }, [dataFileContent])
    useEffect(() => {
        localStorage.setItem('data.json', dataFileContent)
    }, [dataFileContent])

    const [stanModel, setStanModel] = useState<StanModel | undefined>(undefined)

    return (
        <Splitter
            width={width}
            height={height}
            direction="horizontal"
            initialPosition={width / 2}
        >
            <StanFileEditor
                width={0}
                height={0}
                fileName="main.stan"
                fileContent={fileContent}
                onSaveContent={saveFileContent}
                editedFileContent={editedFileContent}
                setEditedFileContent={setEditedFileContent}
                readOnly={false}
                onStanModelLoaded={setStanModel}
            />
            <RightView
                width={0}
                height={0}
                dataFileContent={dataFileContent}
                saveDataFileContent={saveDataFileContent}
                editedDataFileContent={editedDataFileContent}
                setEditedDataFileContent={setEditedDataFileContent}
                stanModel={stanModel}
            />
        </Splitter>
    )
}

type RightViewProps = {
    width: number
    height: number
    dataFileContent: string
    saveDataFileContent: (text: string) => void
    editedDataFileContent: string
    setEditedDataFileContent: (text: string) => void
    stanModel: StanModel | undefined
}

const RightView: FunctionComponent<RightViewProps> = ({width, height, dataFileContent, saveDataFileContent, editedDataFileContent, setEditedDataFileContent, stanModel}) => {
    const parsedData = useMemo(() => {
        try {
            return JSON.parse(dataFileContent)
        }
        catch (e) {
            return undefined
        }
    }, [dataFileContent])
    return (
        <Splitter
            direction="vertical"
            width={width}
            height={height}
            initialPosition={height / 2}
        >
            <DataFileEditor
                width={0}
                height={0}
                fileName="data.json"
                fileContent={dataFileContent}
                onSaveContent={saveDataFileContent}
                editedFileContent={editedDataFileContent}
                setEditedFileContent={setEditedDataFileContent}
                readOnly={false}
            />
            <RunPanel
                width={0}
                height={0}
                stanModel={stanModel}
                data={parsedData}
                dataIsSaved={dataFileContent === editedDataFileContent}
            />
        </Splitter>
    )
}

export default HomePage