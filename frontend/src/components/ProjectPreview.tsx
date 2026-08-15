/*import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Project } from "../types";
import { iframeScript } from "../assets/assets";
import EditorPanel from "./EditorPanel";
import LoaderSteps from "./LoaderSteps";

interface ProjectPreviewProps {
    project: Project;
    isGenerating: boolean;
    device?: "phone" | "tablet" | "desktop";
    showEditorPanel?: boolean;
}

export interface ProjectPreviewRef {
    getCode: () => string | undefined;
}

const ProjectPreview = forwardRef<ProjectPreviewRef, ProjectPreviewProps>(
    (
        {
            project,
            isGenerating,
            device = "desktop",
            showEditorPanel = true,
        },
        ref
    ) => {
        const iframeRef = useRef<HTMLIFrameElement>(null);

        const [selectedElement, setSelectedElement] = useState<any>(null);

        const resolutions = {
            phone: "w-[412px]",
            tablet: "w-[768px]",
            desktop: "w-full",
        };

        useImperativeHandle(ref, () => ({
            getCode: () => {
                const doc = iframeRef.current?.contentDocument;
                if (!doc) return undefined;

                //1.removes our selection class / attributes / outline from all elements
                doc.querySelectorAll('.ai-selected-element,[data-ai-selected]').forEach(
                    (el) => {
                        el.classList.remove('ai-selected-element');
                        el.removeAttribute('data-ai-selected');
                        (el as HTMLElement).style.outline = '';
                    }
                );

                //2.remove injected style + script from the document
                const previewStyle = doc.getElementById('ai-preview-style');
                if (previewStyle) previewStyle.remove();
                const previewScript = doc.getElementById('ai-preview-script');
                if (previewScript) previewScript.remove();



                //3.seriliaze clean HTML
                const html = doc.documentElement.outerHTML;
                return html;


            }
        }));



        useEffect(() => {
            const handleMessage = (event: MessageEvent) => {
                if (event.data.type === "ELEMENT_SELECTED") {
                    setSelectedElement(event.data.payload);
                } else if (event.data.type === "CLEAR_SELECTION") {
                    setSelectedElement(null);
                }
            };

            window.addEventListener("message", handleMessage);

            return () => {
                window.removeEventListener("message", handleMessage);
            };
        }, []);

        const handleUpdate = (updates: any) => {
            if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage(
                    {
                        type: "UPDATE_ELEMENT",
                        payload: updates,
                    },
                    "*"
                );
            }
        };

        const injectPreview = (html: string) => {
            if (!html) return "";
            if (!showEditorPanel) return html;

            if (html.includes("</body>")) {
                return html.replace("</body>", iframeScript + "</body>");
            } else {
                return html + iframeScript;
            }
        };

        return (
            <div
                className="relative h-full bg-gray-900 flex-1 rounded-xl overflow-hidden
                max-sm:ml-2"
            >
                {project.current_code ? (
                    <>
                        <iframe
                            key={project.current_code}
                            ref={iframeRef}
                            srcDoc={injectPreview(project.current_code)}
                            className={`h-full max-sm:w-full ${resolutions[device]} mx-auto transition-all`}
                        />

                        {showEditorPanel && selectedElement && (
                            <EditorPanel
                                selectedElement={selectedElement}
                                onUpdate={handleUpdate}
                                onClose={() => {
                                    setSelectedElement(null);

                                    if (iframeRef.current?.contentWindow) {
                                        iframeRef.current.contentWindow.postMessage(
                                            {
                                                type: "CLEAR_SELECTION_REQUEST",
                                            },
                                            "*"
                                        );
                                    }
                                }}
                            />
                        )}
                    </>
                ) : (
                    isGenerating && (
                        <LoaderSteps />
                    )
                )}
            </div>
        );
    }
);

export default ProjectPreview;*/






import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";

import type { Project } from "../types";
import { iframeScript } from "../assets/assets";
import EditorPanel from "./EditorPanel";
import LoaderSteps from "./LoaderSteps";

interface ProjectPreviewProps {
    project: Project;
    isGenerating: boolean;
    device?: "phone" | "tablet" | "desktop";
    showEditorPanel?: boolean;
}

export interface ProjectPreviewRef {
    getCode: () => string | undefined;
}

const ProjectPreview = forwardRef<
    ProjectPreviewRef,
    ProjectPreviewProps
>(
    (
        {
            project,
            isGenerating,
            device = "desktop",
            showEditorPanel = true,
        },
        ref
    ) => {

        const iframeRef =
            useRef<HTMLIFrameElement>(null);

        const [selectedElement, setSelectedElement] =
            useState<any>(null);

        const [iframeKey, setIframeKey] =
            useState(0);


        // ==================================================
        // DEVICE RESOLUTION
        // ==================================================

        const resolutions = {
            phone: "w-[412px]",
            tablet: "w-[768px]",
            desktop: "w-full",
        };


        // ==================================================
        // CLEAN HTML
        // ==================================================

        const getCleanHTML = () => {

            const doc =
                iframeRef.current?.contentDocument;

            if (!doc) {
                return undefined;
            }


            // Remove editor selection
            doc
                .querySelectorAll(
                    ".ai-selected-element, [data-ai-selected]"
                )
                .forEach((el) => {

                    el.classList.remove(
                        "ai-selected-element"
                    );

                    el.removeAttribute(
                        "data-ai-selected"
                    );

                    (
                        el as HTMLElement
                    ).style.outline = "";

                });


            // Remove injected preview style
            const previewStyle =
                doc.getElementById(
                    "ai-preview-style"
                );

            if (previewStyle) {
                previewStyle.remove();
            }


            // Remove injected preview script
            const previewScript =
                doc.getElementById(
                    "ai-preview-script"
                );

            if (previewScript) {
                previewScript.remove();
            }


            return doc.documentElement.outerHTML;
        };


        // ==================================================
        // EXPOSE GET CODE TO PARENT
        // ==================================================

        useImperativeHandle(
            ref,
            () => ({

                getCode: () => {

                    return getCleanHTML();

                },

            }),
            []
        );


        // ==================================================
        // FORCE IFRAME REFRESH WHEN PROJECT CHANGES
        // ==================================================

        useEffect(() => {

            if (!project.current_code) {
                return;
            }


            console.log(
                "🔄 PROJECT PREVIEW UPDATED"
            );

            console.log(
                "📦 VERSION:",
                project.current_version_index
            );

            console.log(
                "💻 CODE LENGTH:",
                project.current_code.length
            );


            // Clear selected element
            setSelectedElement(null);


            // Force iframe recreation
            setIframeKey(
                (previous) => previous + 1
            );


        }, [
            project.current_code,
            project.current_version_index,
        ]);


        // ==================================================
        // RECEIVE MESSAGES FROM IFRAME
        // ==================================================

        useEffect(() => {

            const handleMessage = (
                event: MessageEvent
            ) => {

                if (!event.data) {
                    return;
                }


                if (
                    event.data.type ===
                    "ELEMENT_SELECTED"
                ) {

                    setSelectedElement(
                        event.data.payload
                    );

                }


                else if (
                    event.data.type ===
                    "CLEAR_SELECTION"
                ) {

                    setSelectedElement(null);

                }

            };


            window.addEventListener(
                "message",
                handleMessage
            );


            return () => {

                window.removeEventListener(
                    "message",
                    handleMessage
                );

            };

        }, []);


        // ==================================================
        // UPDATE ELEMENT FROM EDITOR PANEL
        // ==================================================

        const handleUpdate = (
            updates: any
        ) => {

            if (
                iframeRef.current?.contentWindow
            ) {

                iframeRef.current.contentWindow.postMessage(
                    {
                        type:
                            "UPDATE_ELEMENT",

                        payload:
                            updates,
                    },
                    "*"
                );

            }

        };


        // ==================================================
        // INJECT EDITOR SCRIPT
        // ==================================================

        const injectPreview = (
            html: string
        ) => {

            if (!html) {
                return "";
            }


            if (!showEditorPanel) {
                return html;
            }


            if (
                html.toLowerCase().includes(
                    "</body>"
                )
            ) {

                return html.replace(
                    /<\/body>/i,
                    `${iframeScript}</body>`
                );

            }


            return (
                html +
                iframeScript
            );

        };


        // ==================================================
        // CURRENT HTML
        // ==================================================

        const previewHTML =
            project.current_code
                ? injectPreview(
                    project.current_code
                )
                : "";


        // ==================================================
        // DEBUG
        // ==================================================

        console.log(
            "🖥️ PROJECT PREVIEW RENDER"
        );

        console.log(
            "VERSION:",
            project.current_version_index
        );

        console.log(
            "CODE LENGTH:",
            project.current_code?.length || 0
        );

        console.log(
            "IFRAME KEY:",
            iframeKey
        );


        // ==================================================
        // UI
        // ==================================================

        return (

            <div
                className="
                    relative
                    h-full
                    bg-gray-900
                    flex-1
                    rounded-xl
                    overflow-hidden
                    max-sm:ml-2
                "
            >

                {project.current_code ? (

                    <>

                        {/* ==================================
                            WEBSITE IFRAME
                        ================================== */}

                        <iframe
                            key={`${project.current_version_index}-${iframeKey}`}
                            ref={iframeRef}
                            srcDoc={previewHTML}
                            title="Website Preview"
                            className={`
                                h-full
                                max-sm:w-full
                                ${resolutions[device]}
                                mx-auto
                                transition-all
                                border-0
                            `}
                        />


                        {/* ==================================
                            EDITOR PANEL
                        ================================== */}

                        {showEditorPanel &&
                            selectedElement && (

                                <EditorPanel

                                    selectedElement={
                                        selectedElement
                                    }

                                    onUpdate={
                                        handleUpdate
                                    }

                                    onClose={() => {

                                        setSelectedElement(
                                            null
                                        );


                                        if (
                                            iframeRef
                                                .current
                                                ?.contentWindow
                                        ) {

                                            iframeRef
                                                .current
                                                .contentWindow
                                                .postMessage(
                                                    {
                                                        type:
                                                            "CLEAR_SELECTION_REQUEST",
                                                    },
                                                    "*"
                                                );

                                        }

                                    }}

                                />

                            )}

                    </>

                ) : (

                    isGenerating && (

                        <LoaderSteps />

                    )

                )}

            </div>

        );

    }
);


ProjectPreview.displayName =
    "ProjectPreview";


export default ProjectPreview;