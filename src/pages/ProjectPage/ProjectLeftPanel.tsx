import { ContentCopy, Edit, NoteAdd, Refresh, Settings } from "@mui/icons-material";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import { useModalDialog } from "../../ApplicationBar";
import Hyperlink from "../../components/Hyperlink";
import ModalWindow from "../../components/ModalWindow/ModalWindow";
import SmallIconButton from "../../components/SmallIconButton";
import { alert, confirm, prompt } from "../../confirm_prompt_alert";
import { setProjectFileContent } from "../../dbInterface/dbInterface";
import { useGithubAuth } from "../../GithubAuth/useGithubAuth";
import useRoute from "../../useRoute";
import { useWorkspace } from "../WorkspacePage/WorkspacePageContext";
import BackButton from "./BackButton";
import CloneProjectWindow from "./CloneProjectWindow/CloneProjectWindow";
import NewFileWindow from "./NewFileWindow/NewFileWindow";
import ProjectFileBrowser2 from "./ProjectFileBrowser/ProjectFileBrowser2";
import { useProject } from "./ProjectPageContext";
import ProjectSettingsWindow from "./ProjectSettingsWindow";

type Props = {
    width: number
    height: number
}

const ProjectLeftPanel: FunctionComponent<Props> = ({width, height}) => {
    const {projectId, project, workspaceId, openTab, closeTab, projectFiles, setProjectProperty, refreshFiles, deleteFile, duplicateFile, renameFile} = useProject()
    const {visible: settingsWindowVisible, handleOpen: openSettingsWindow, handleClose: closeSettingsWindow} = useModalDialog()
    const {visible: cloneProjectWindowVisible, handleOpen: openCloneProjectWindow, handleClose: closeCloneProjectWindow} = useModalDialog()
    const {visible: newFileWindowVisible, handleOpen: openNewFileWindow, handleClose: closeNewFileWindow} = useModalDialog()
    const {workspace, workspaceRole} = useWorkspace()
    const {setRoute} = useRoute()
    const handleOpenFile = useCallback((fileName: string) => {
        openTab(`file:${fileName}`)
    }, [openTab])

    const handleDeleteFile = useCallback(async (fileName: string) => {
        const okay = await confirm(`Delete ${fileName}?`)
        if (!okay) return
        deleteFile(fileName)
        closeTab(`file:${fileName}`)
    }, [deleteFile, closeTab])

    const handleDuplicateFile = useCallback(async (fileName: string) => {
        let newFileName: string | null
        // eslint-disable-next-line no-constant-condition
        while (true) {
            newFileName = await prompt('Enter new file name:', fileName)
            if (!newFileName) return
            if (newFileName !== fileName) {
                break
            }
        }
        const existingFile = projectFiles?.find(f => f.fileName === newFileName)
        if (existingFile) {
            await alert(`File ${newFileName} already exists.`)
            return
        }
        duplicateFile(fileName, newFileName)
    }, [projectFiles, duplicateFile])

    const handleRenameFile = useCallback(async (fileName: string) => {
        let newFileName: string | null
        // eslint-disable-next-line no-constant-condition
        while (true) {
            newFileName = await prompt('Enter new file name:', fileName)
            if (!newFileName) return
            if (newFileName !== fileName) {
                break
            }
        }
        const existingFile = projectFiles?.find(f => f.fileName === newFileName)
        if (existingFile) {
            await alert(`File ${newFileName} already exists.`)
            return
        }
        renameFile(fileName, newFileName)
    }, [projectFiles, renameFile])


    const [initialized, setInitialized] = useState(false)

    // if there is exactly one .spa file, open it
    useEffect(() => {
        if (!projectFiles) return
        if (initialized) return
        const spaFiles = projectFiles.filter(f => f.fileName.endsWith('.spa'))
        if (spaFiles.length === 1) {
            openTab(`file:${spaFiles[0].fileName}`)
        }
        setInitialized(true)
    }, [projectFiles, openTab, initialized])

    const handleEditProjectName = useCallback(async () => {
        const newName = await prompt('Enter new project name:', project?.name || '')
        if (!newName) return
        if (!project) return
        setProjectProperty('name', newName)
    }, [project, setProjectProperty])

    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    const handleCreateFile = useCallback(async (fileName: string, fileContent: string) => {
        await setProjectFileContent(workspaceId, projectId, fileName, fileContent, auth)
        closeNewFileWindow()
        refreshFiles()
        openTab(`file:${fileName}`)
    }, [workspaceId, projectId, auth, refreshFiles, openTab, closeNewFileWindow])

    const cloneProjectTitle = userId ? 'Clone this project' : 'You must be logged in to clone this project.'

    const padding = 10
    const W = width - 2 * padding
    const H = height - 2 * padding
    return (
        <div style={{position: 'absolute', left: padding, top: padding, width: W, height: H}}>
            <BackButton />
            <hr />
            <div style={{fontWeight: 'bold', whiteSpace: 'nowrap', paddingBottom: 10}}>
                Project: {project?.name}&nbsp;
                {
                    (workspaceRole === 'admin' || workspaceRole === 'editor') && (
                        <SmallIconButton onClick={handleEditProjectName} title="Edit project name" icon={<Edit />} />
                    )
                }
            </div>
            <table className="table1">
                <tbody>
                    <tr>
                        <td>ID:</td>
                        <td style={{whiteSpace: 'nowrap'}}>{projectId}</td>
                    </tr>
                    <tr>
                        <td>Workspace:</td>
                        <td style={{whiteSpace: 'nowrap'}}><Hyperlink onClick={() => {setRoute({page: 'workspace', workspaceId})}}>{workspace?.name}</Hyperlink></td>
                    </tr>
                </tbody>
            </table>
            <div style={{paddingTop: 10}}>
                <button onClick={openSettingsWindow} title="Project settings"><SmallIconButton icon={<Settings />} /> Settings</button>
                &nbsp;
                <button disabled={!userId} onClick={openCloneProjectWindow} title={cloneProjectTitle}><SmallIconButton disabled={!userId} icon={<ContentCopy />} /> Clone project</button>
            </div>

            <hr />

            <div style={{paddingBottom: 5}}>
                <SmallIconButton onClick={openNewFileWindow} title="Create a new file" icon={<NoteAdd />} label="new file" fontSize={24} />
                &nbsp;&nbsp;&nbsp;&nbsp;
                <SmallIconButton onClick={refreshFiles} title="Refresh files" icon={<Refresh />} fontSize={24} />
            </div>
            <ProjectFileBrowser2
                projectFiles={projectFiles}
                onOpenFile={handleOpenFile}
                onDeleteFile={handleDeleteFile}
                onDuplicateFile={handleDuplicateFile}
                onRenameFile={handleRenameFile}
            />

            <ModalWindow
                open={settingsWindowVisible}
                onClose={closeSettingsWindow}
            >
                <ProjectSettingsWindow />
            </ModalWindow>
            <ModalWindow
                open={cloneProjectWindowVisible}
                onClose={closeCloneProjectWindow}
            >
                <CloneProjectWindow
                    onClose={closeCloneProjectWindow}
                />
            </ModalWindow>
            <ModalWindow
                open={newFileWindowVisible}
                onClose={closeNewFileWindow}
            >
                <NewFileWindow
                    onCreateFile={handleCreateFile}
                />
            </ModalWindow>
        </div>
    )
}

export default ProjectLeftPanel