
import {
    BotIcon,
    EyeIcon,
    Loader2Icon,
    SendIcon,
    UserIcon,
} from "lucide-react";

import type {
    Message,
    Project,
    Version,
} from "../types";

import { Link } from "react-router-dom";

import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import api from "@/configs/axios";
import { toast } from "sonner";

interface SidebarProps {
    isMenuOpen: boolean;
    project: Project;
    setProject: (project: Project) => void;
    isGenerating: boolean;
    setIsGenerating: (isGenerating: boolean) => void;
}

type ProjectItem = Message | Version;

const Sidebar = ({
    isMenuOpen,
    project,
    setProject,
    isGenerating,
    setIsGenerating,
}: SidebarProps) => {

    const messageRef = useRef<HTMLDivElement>(null);

    // IMPORTANT:
    // useRef lock prevents two revision requests
    // from running at the same time.
    const revisionRunningRef = useRef(false);

    const [input, setInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);


    // ==================================================
    // COMBINE CONVERSATION + VERSIONS
    // ==================================================

    const projectItems = useMemo(() => {

        const conversations =
            project.conversation ?? [];

        const versions =
            project.versions ?? [];

        const items: ProjectItem[] = [
            ...conversations,
            ...versions,
        ];

        return items.sort(
            (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime()
        );

    }, [
        project.conversation,
        project.versions,
    ]);


    // ==================================================
    // AUTO SCROLL
    // ==================================================

    useEffect(() => {

        if (!messageRef.current) {
            return;
        }

        messageRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });

    }, [
        projectItems.length,
        isGenerating,
    ]);


    // ==================================================
    // ROLLBACK
    // ==================================================

    const handleRollback = async (
        versionId: string
    ) => {

        if (!project?.id || !versionId) {
            toast.error("Project or version not found");
            return;
        }

        try {

            console.log(
                "========================================"
            );

            console.log(
                "↩️ ROLLBACK START"
            );

            console.log(
                "PROJECT ID:",
                project.id
            );

            console.log(
                "VERSION ID:",
                versionId
            );

            console.log(
                "========================================"
            );

            const { data } = await api.get(
                `/project/rollback/${project.id}/${versionId}`
            );

            console.log(
                "✅ ROLLBACK RESPONSE:",
                data
            );

            const response = await api.get(
                `/user/projects/${project.id}`
            );

            if (response.data?.project) {

                setProject(
                    response.data.project
                );

                console.log(
                    "✅ PROJECT REFRESHED AFTER ROLLBACK"
                );

            } else {

                setProject({
                    ...project,
                    current_code:
                        data?.code || project.current_code,
                    current_version_index:
                        data?.versionId || versionId,
                });

            }

            toast.success(
                data?.message ||
                "Version rolled back successfully"
            );

            console.log(
                "🎉 ROLLBACK COMPLETED"
            );

        } catch (error: any) {

            console.error(
                "========================================"
            );

            console.error(
                "❌ ROLLBACK ERROR:",
                error
            );

            console.error(
                "❌ SERVER RESPONSE:",
                error?.response?.data
            );

            console.error(
                "========================================"
            );

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to rollback version"
            );

        }

    };


    // ==================================================
    // REVISION
    // ==================================================

    const handleRevisions = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        const prompt = input.trim();


        // ==================================================
        // VALIDATION
        // ==================================================

        if (!prompt) {
            return;
        }

        if (!project?.id) {

            toast.error(
                "Project ID not found"
            );

            return;
        }

        if (!project.current_code) {

            toast.error(
                "Please wait until the website is generated."
            );

            return;
        }


        // ==================================================
        // PREVENT DOUBLE REQUEST
        // ==================================================

        // This is VERY important.
        // Even if the user clicks twice quickly,
        // only ONE API request will be sent.

        if (
            revisionRunningRef.current ||
            isSubmitting ||
            isGenerating
        ) {

            console.log(
                "⏳ REVISION ALREADY RUNNING"
            );

            return;
        }


        // Lock immediately BEFORE API request
        revisionRunningRef.current = true;

        setIsSubmitting(true);
        setIsGenerating(true);


        console.log(
            "========================================"
        );

        console.log(
            "🔄 PROJECT REVISION START"
        );

        console.log(
            "PROJECT ID:",
            project.id
        );

        console.log(
            "REVISION:",
            prompt
        );

        console.log(
            "========================================"
        );


        // ==================================================
        // SHOW USER MESSAGE IMMEDIATELY
        // ==================================================

        const temporaryUserMessage: Message = {

            id:
                `temp-user-${Date.now()}`,

            role:
                "user",

            content:
                prompt,

            timestamp:
                new Date().toISOString(),

        };


        // IMPORTANT:
        // Message type does NOT contain projectId.
        // So don't add projectId here.

        const projectBeforeRevision = project;

        setProject({

            ...project,

            conversation: [
                ...(project.conversation ?? []),
                temporaryUserMessage,
            ],

        });


        // Clear input immediately
        setInput("");


        try {

            // ==================================================
            // SEND REVISION
            // ==================================================

            console.log(
                "🚀 SENDING REVISION REQUEST..."
            );


            const { data } = await api.post(
                `/project/revision/${project.id}`,
                {
                    message: prompt,
                }
            );


            console.log(
                "========================================"
            );

            console.log(
                "✅ REVISION RESPONSE RECEIVED"
            );

            console.log(
                "REVISION RESPONSE:",
                data
            );

            console.log(
                "========================================"
            );


            // ==================================================
            // UPDATE PROJECT
            // ==================================================

            if (
                data?.project
            ) {

                console.log(
                    "✅ UPDATED PROJECT RECEIVED"
                );

                console.log(
                    "📦 NEW VERSION:",
                    data.project.current_version_index
                );

                console.log(
                    "💻 NEW CODE LENGTH:",
                    data.project.current_code?.length || 0
                );

                console.log(
                    "💬 CONVERSATIONS:",
                    data.project.conversation?.length || 0
                );

                console.log(
                    "📚 VERSIONS:",
                    data.project.versions?.length || 0
                );


                // VERY IMPORTANT:
                // Replace local project with the
                // latest backend project.

                setProject(
                    data.project
                );


                toast.success(
                    data?.message ||
                    "Website updated successfully!"
                );


                console.log(
                    "🎉 WEBSITE REVISION COMPLETED"
                );

            }

            else {

                // ==================================================
                // BACKEND DID NOT RETURN PROJECT
                // FETCH LATEST PROJECT
                // ==================================================

                console.log(
                    "⚠️ PROJECT NOT RETURNED"
                );

                console.log(
                    "📡 FETCHING LATEST PROJECT..."
                );


                const response =
                    await api.get(
                        `/user/projects/${project.id}`
                    );


                if (
                    response.data?.project
                ) {

                    console.log(
                        "✅ LATEST PROJECT RECEIVED"
                    );

                    console.log(
                        "📦 LATEST VERSION:",
                        response.data.project
                            .current_version_index
                    );

                    console.log(
                        "💻 LATEST CODE LENGTH:",
                        response.data.project
                            .current_code?.length || 0
                    );


                    setProject(
                        response.data.project
                    );


                    toast.success(
                        "Website updated successfully!"
                    );

                }

                else {

                    throw new Error(
                        "Updated project was not returned by server"
                    );

                }

            }


        } catch (error: any) {

            console.error(
                "========================================"
            );

            console.error(
                "❌ PROJECT REVISION ERROR"
            );

            console.error(
                error
            );

            console.error(
                "❌ SERVER RESPONSE:",
                error?.response?.data
            );

            console.error(
                "========================================"
            );


            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Unable to update the website."
            );


            // ==================================================
            // RESTORE / REFRESH PROJECT AFTER ERROR
            // ==================================================

            try {

                console.log(
                    "📡 REFRESHING PROJECT AFTER ERROR..."
                );


                const response =
                    await api.get(
                        `/user/projects/${project.id}`
                    );


                if (
                    response.data?.project
                ) {

                    setProject(
                        response.data.project
                    );

                }
                else {

                    // Restore previous project
                    setProject(
                        projectBeforeRevision
                    );

                }

            } catch (refreshError) {

                console.error(
                    "❌ PROJECT REFRESH ERROR:",
                    refreshError
                );

                // Restore old project if refresh fails
                setProject(
                    projectBeforeRevision
                );

            }

        } finally {

            // ==================================================
            // ALWAYS UNLOCK
            // ==================================================

            revisionRunningRef.current =
                false;

            setIsSubmitting(false);
            setIsGenerating(false);


            console.log(
                "🔓 REVISION LOCK RELEASED"
            );

        }

    };


    // ======================================================
    // MESSAGE RENDERER
    // ======================================================

    const renderMessage = (
        message: Message
    ) => {

        const isUser =
            message.role === "user";


        return (

            <div
                key={message.id}
                className={`
                    flex
                    items-start
                    gap-3
                    ${isUser
                        ? "justify-end"
                        : "justify-start"
                    }
                `}
            >

                {/* AI ICON */}

                {!isUser && (

                    <div
                        className="
                            shrink-0
                            w-8
                            h-8
                            rounded-full
                            bg-linear-to-br
                            from-indigo-600
                            to-indigo-700
                            flex
                            items-center
                            justify-center
                        "
                    >

                        <BotIcon
                            className="
                                size-5
                                text-white
                            "
                        />

                    </div>

                )}


                {/* MESSAGE */}

                <div
                    className={`
                        max-w-[80%]
                        px-4
                        py-3
                        rounded-2xl
                        shadow-sm
                        text-sm
                        leading-relaxed
                        whitespace-pre-wrap
                        wrap-break-word

                        ${
                            isUser
                                ? `
                                    bg-linear-to-r
                                    from-indigo-500
                                    to-indigo-600
                                    text-white
                                    rounded-tr-none
                                `
                                : `
                                    bg-gray-800
                                    text-gray-100
                                    rounded-tl-none
                                `
                        }
                    `}
                >

                    {message.content}

                </div>


                {/* USER ICON */}

                {isUser && (

                    <div
                        className="
                            shrink-0
                            w-8
                            h-8
                            rounded-full
                            bg-gray-700
                            flex
                            items-center
                            justify-center
                        "
                    >

                        <UserIcon
                            className="
                                size-5
                                text-gray-200
                            "
                        />

                    </div>

                )}

            </div>

        );

    };


    // ======================================================
    // VERSION RENDERER
    // ======================================================

    const renderVersion = (
        version: Version
    ) => {

        return (

            <div
                key={version.id}
                className="
                    w-[90%]
                    mx-auto
                    my-2
                    p-3
                    rounded-xl
                    bg-gray-800
                    text-gray-100
                    shadow
                    flex
                    flex-col
                    gap-3
                "
            >

                <div>

                    <p
                        className="
                            text-xs
                            font-medium
                            text-gray-200
                        "
                    >
                        Code Updated
                    </p>


                    <p
                        className="
                            text-xs
                            text-gray-500
                            mt-1
                        "
                    >

                        {new Date(
                            version.timestamp
                        ).toLocaleString()}

                    </p>

                </div>


                <div
                    className="
                        flex
                        items-center
                        justify-between
                        gap-2
                    "
                >

                    {project.current_version_index ===
                        version.id ? (

                        <button
                            type="button"
                            className="
                                px-3
                                py-1.5
                                rounded-md
                                text-xs
                                bg-gray-700
                                text-gray-300
                                cursor-default
                            "
                        >
                            Current version
                        </button>

                    ) : (

                        <button
                            type="button"
                            onClick={() =>
                                handleRollback(
                                    version.id
                                )
                            }
                            className="
                                px-3
                                py-1.5
                                rounded-md
                                text-xs
                                bg-indigo-500
                                hover:bg-indigo-600
                                text-white
                                transition-colors
                            "
                        >
                            Roll back
                        </button>

                    )}


                    <Link
                        target="_blank"
                        rel="noopener noreferrer"
                        to={
                            `/preview/${project.id}/${version.id}`
                        }
                        className="
                            inline-flex
                            items-center
                            justify-center
                        "
                    >

                        <EyeIcon
                            className="
                                size-7
                                p-1
                                bg-gray-700
                                hover:bg-indigo-500
                                transition-colors
                                rounded
                            "
                        />

                    </Link>

                </div>

            </div>

        );

    };


    // ======================================================
    // RETURN
    // ======================================================

    return (

        <div
            className={`
                h-full
                sm:max-w-sm
                rounded-xl
                bg-gray-900
                border
                border-gray-800
                transition-all

                ${
                    isMenuOpen
                        ? "max-sm:w-0 overflow-hidden"
                        : "w-full"
                }
            `}
        >

            <div
                className="
                    flex
                    flex-col
                    h-full
                "
            >

                {/* ==================================================
                    MESSAGES
                ================================================== */}

                <div
                    className="
                        flex-1
                        overflow-y-auto
                        no-scrollbar
                        px-3
                        py-3
                        flex
                        flex-col
                        gap-4
                    "
                >

                    {/* EMPTY STATE */}

                    {projectItems.length === 0 && (

                        <div
                            className="
                                flex-1
                                flex
                                items-center
                                justify-center
                            "
                        >

                            <div
                                className="
                                    text-center
                                    text-gray-500
                                "
                            >

                                <BotIcon
                                    className="
                                        size-8
                                        mx-auto
                                        mb-2
                                        opacity-50
                                    "
                                />

                                <p className="text-sm">
                                    Your AI conversation
                                    will appear here.
                                </p>

                            </div>

                        </div>

                    )}


                    {/* PROJECT ITEMS */}

                    {projectItems.map(
                        (item) => {

                            const isMessage =
                                "content" in item;


                            if (isMessage) {

                                return renderMessage(
                                    item as Message
                                );

                            }


                            return renderVersion(
                                item as Version
                            );

                        }
                    )}


                    {/* AI GENERATING */}

                    {isGenerating && (

                        <div
                            className="
                                flex
                                items-start
                                gap-3
                                justify-start
                            "
                        >

                            <div
                                className="
                                    shrink-0
                                    w-8
                                    h-8
                                    rounded-full
                                    bg-linear-to-br
                                    from-indigo-600
                                    to-indigo-700
                                    flex
                                    items-center
                                    justify-center
                                "
                            >

                                <BotIcon
                                    className="
                                        size-5
                                        text-white
                                    "
                                />

                            </div>


                            <div
                                className="
                                    bg-gray-800
                                    rounded-2xl
                                    rounded-tl-none
                                    px-4
                                    py-3
                                    flex
                                    items-center
                                    gap-1.5
                                "
                            >

                                <span
                                    className="
                                        size-2
                                        rounded-full
                                        bg-gray-500
                                        animate-bounce
                                    "
                                />

                                <span
                                    className="
                                        size-2
                                        rounded-full
                                        bg-gray-500
                                        animate-bounce
                                    "
                                    style={{
                                        animationDelay:
                                            "0.15s",
                                    }}
                                />

                                <span
                                    className="
                                        size-2
                                        rounded-full
                                        bg-gray-500
                                        animate-bounce
                                    "
                                    style={{
                                        animationDelay:
                                            "0.3s",
                                    }}
                                />

                            </div>

                        </div>

                    )}


                    <div
                        ref={messageRef}
                    />

                </div>


                {/* ==================================================
                    INPUT
                ================================================== */}

                <form
                    onSubmit={
                        handleRevisions
                    }
                    className="
                        m-3
                        relative
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            gap-2
                        "
                    >

                        <textarea
                            value={input}
                            onChange={(e) =>
                                setInput(
                                    e.target.value
                                )
                            }
                            rows={4}
                            placeholder={
                                isGenerating ||
                                isSubmitting
                                    ? "AI is generating..."
                                    : "Describe your website or request changes..."
                            }
                            className="
                                flex-1
                                p-3
                                rounded-xl
                                resize-none
                                text-sm
                                outline-none
                                ring-1
                                ring-gray-700
                                focus:ring-indigo-500
                                bg-gray-800
                                text-gray-100
                                placeholder-gray-400
                                transition-all
                            "
                            disabled={
                                isGenerating ||
                                isSubmitting
                            }
                        />


                        <button
                            type="submit"
                            disabled={
                                isGenerating ||
                                isSubmitting ||
                                !input.trim()
                            }
                            className="
                                absolute
                                bottom-2.5
                                right-2.5
                                rounded-full
                                bg-linear-to-r
                                from-indigo-500
                                to-indigo-600
                                hover:from-indigo-600
                                hover:to-indigo-700
                                text-white
                                transition-colors
                                disabled:opacity-50
                                disabled:cursor-not-allowed
                            "
                        >

                            {isGenerating ||
                                isSubmitting ? (

                                <Loader2Icon
                                    className="
                                        size-7
                                        p-1.5
                                        animate-spin
                                    "
                                />

                            ) : (

                                <SendIcon
                                    className="
                                        size-7
                                        p-1.5
                                    "
                                />

                            )}

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );
};

export default Sidebar;