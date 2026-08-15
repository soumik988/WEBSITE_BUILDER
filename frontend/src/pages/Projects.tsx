/*import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Project } from '../types'
import {
  ArrowBigDownDashIcon,
  EyeIcon,
  EyeOffIcon,
  FullscreenIcon,
  LaptopIcon,
  Loader2Icon,
  MessageSquareIcon,
  SaveIcon,
  SmartphoneIcon,
  TabletIcon,
  XIcon
} from 'lucide-react'

import Sidebar from '../components/Sidebar'
import ProjectPreview, { type ProjectPreviewRef } from '../components/ProjectPreview'
import api from '@/configs/axios'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'

const Projects = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { data: session, isPending } = authClient.useSession()

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(true)
  const [device, setDevice] = useState<'phone' | 'tablet' | 'desktop'>('desktop')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const previewRef = useRef<ProjectPreviewRef>(null)

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/user/projects/${projectId}`)
      setProject(data.project)
      setIsGenerating(data.project.current_code ? false : true)
      setLoading(false)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message)
      console.log(error)
    }
  }

  const saveProject = async () => {

  }

  const downloadCode = () => {
    const code = previewRef.current?.getCode() || project?.current_code;
    if (!code) {
      if (isGenerating) {
        return
      }
      return
    }
    const element = document.createElement('a');
    const file = new Blob([code], { type: "text/html" });
    element.href = URL.createObjectURL(file)
    element.download = 'index.html';
    document.body.appendChild(element)
    element.click();
  }


  const togglePublish = async () => {

  }

  useEffect(() => {
    if (session?.user) {
      fetchProject();
    } else if (!isPending && !session?.user) {
      navigate('/')
      toast("plase login to view your Projects")
    }
  })

  useEffect(() => {
    if (project && !project.current_code) {
      const intervalId = setInterval(fetchProject, 10000);
      return () => clearInterval(intervalId)
    }

  }, [project])

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loader2Icon className='size-7 animate-spin text-violet-200' />
      </div>
    )
  }

  return project ? (
    <div className='flex flex-col h-screen w-full bg-gray-900 text-white'>
      {/* Builder Navbar */ /*
<div className='flex max-sm:flex-col sm:items-center gap-4 px-4 py-2 no-scrollbar'>

{/* Left */ /*
<div className='flex items-center gap-2 sm:min-w-90 text-nowrap'>
<img
  src='/favicon.svg'
  alt='logo'
  className='h-6 cursor-pointer'
  onClick={() => navigate('/')}
/>

<div className='max-w-64 sm:max-w-xs'>
  <p className='text-sm font-medium capitalize truncate'>
    {project.name}
  </p>
  <p className='text-xs text-gray-400 -mt-0.5'>
    Previewing last saved version
  </p>
</div>

<div className='sm:hidden flex-1 flex justify-end'>
  {isMenuOpen ? (
    <XIcon
      onClick={() => setIsMenuOpen(false)}
      className='size-6 cursor-pointer'
    />
  ) : (
    <MessageSquareIcon
      onClick={() => setIsMenuOpen(true)}
      className='size-6 cursor-pointer'
    />
  )}
</div>
</div>

{/* Middle */ /*
<div className='hidden sm:flex gap-2 bg-gray-950 p-1.5 rounded-md'>
  <SmartphoneIcon
    onClick={() => setDevice('phone')}
    className={`size-6 p-1 rounded cursor-pointer ${device === 'phone' ? 'bg-gray-700' : ''
      }`}
  />

  <TabletIcon
    onClick={() => setDevice('tablet')}
    className={`size-6 p-1 rounded cursor-pointer ${device === 'tablet' ? 'bg-gray-700' : ''
      }`}
  />

  <LaptopIcon
    onClick={() => setDevice('desktop')}
    className={`size-6 p-1 rounded cursor-pointer ${device === 'desktop' ? 'bg-gray-700' : ''
      }`}
  />
</div>

{/* Right */ /*
<div className='flex items-center justify-end gap-3 flex-1 text-xs sm:text-sm'>
  <button onClick={saveProject}
    disabled={isSaving}
    className='max-sm:hidden bg-gray-800 hover:bg-gray-700 text-white px-3
     py-1 flex items-center gap-2 rounded sm:rounded-sm 
    transition-colors border border-gray-700'
  >
    {isSaving ? (
      <Loader2Icon className='animate-spin' size={16} />
    ) : (
      <SaveIcon size={16} />
    )}
    Save
  </button>

  <Link
    target='_blank'
    to={`/preview/${projectId}`}
    className='flex items-center gap-2 px-4
    py-1 rounded sm:rounded-sm border border-gray-700 
    hover:border-gray-500 transition-colors'
  >
    <FullscreenIcon size={16} />
    Preview
  </Link>

  <button onClick={downloadCode} className='bg-linear-to-br from-blue-700 to-blue-600
  hover:from-blue-600 hover:to-blue-500 text-white px-3.5 py-1
  flex items-center gap-2 rounded sm:rounded-sm transition-colors'>
    <ArrowBigDownDashIcon size={16} />
    Download
  </button>

  <button onClick={togglePublish} className='bg-linear-to-br from-indigo-700 to-indigo-600
  hover:from-indigo-600 hover:to-indigo-500 text-white px-3.5 py-1
  flex items-center gap-2 rounded sm:rounded-sm transition-colors '>
    {project.isPublished ? (
      <EyeOffIcon size={16} />
    ) : (
      <EyeIcon size={16} />
    )}
    {project.isPublished ? 'Unpublish' : 'Publish'}
  </button>
</div>
</div>
<div className='flex-1 flex overflow-auto'>
{/*Left side bar*/ /*
<Sidebar isMenuOpen={isMenuOpen} project={project} setProject={(p) => setProject(p)} isGenerating={isGenerating} setIsGenerating={setIsGenerating} />

<div className='flex-1 p-2 pl-0'>
  <ProjectPreview ref={previewRef} project={project} isGenerating={isGenerating}
    device={device} />

</div>
</div>
</div>
) : (
<div className='flex items-center justify-center h-screen'>
<p className='text-2xl font-medium text-gray-200'>
Unable to Load Project...!
</p>
</div>
)
}

export default Projects*/


import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Project } from "../types";

import {
    ArrowBigDownDashIcon,
    EyeIcon,
    EyeOffIcon,
    FullscreenIcon,
    LaptopIcon,
    Loader2Icon,
    MessageSquareIcon,
    SaveIcon,
    SmartphoneIcon,
    TabletIcon,
    XIcon,
} from "lucide-react";

import Sidebar from "../components/Sidebar";

import ProjectPreview, {
    type ProjectPreviewRef,
} from "../components/ProjectPreview";

import api from "@/configs/axios";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

const Projects = () => {
    const { projectId } =
        useParams<{ projectId: string }>();

    const navigate = useNavigate();

    const {
        data: session,
        isPending,
    } = authClient.useSession();

    // ==========================================================
    // STATES
    // ==========================================================

    const [project, setProject] =
        useState<Project | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [isGenerating, setIsGenerating] =
        useState(true);

    const [device, setDevice] =
        useState<"phone" | "tablet" | "desktop">(
            "desktop"
        );

    const [isMenuOpen, setIsMenuOpen] =
        useState(false);

    const [isSaving, setIsSaving] =
        useState(false);

    const [isPublishing, setIsPublishing] =
        useState(false);

    const previewRef =
        useRef<ProjectPreviewRef>(null);

    // ==========================================================
    // FETCH PROJECT
    // ==========================================================

    const fetchProject = useCallback(
        async (showError = true) => {
            if (!projectId) {
                console.error(
                    "❌ PROJECT ID MISSING"
                );

                return;
            }

            try {
                console.log(
                    "📡 FETCHING PROJECT:",
                    projectId
                );

                const { data } =
                    await api.get(
                        `/user/projects/${projectId}`
                    );

                const currentProject =
                    data?.project;

                if (!currentProject) {
                    throw new Error(
                        "Project not found"
                    );
                }

                console.log(
                    "✅ PROJECT RECEIVED:",
                    currentProject
                );

                console.log(
                    "💬 CONVERSATIONS:",
                    currentProject.conversation
                );

                console.log(
                    "💻 CODE AVAILABLE:",
                    Boolean(
                        currentProject.current_code
                    )
                );

                setProject(
                    currentProject
                );

                if (
                    currentProject.current_code
                ) {
                    console.log(
                        "🎉 WEBSITE GENERATION COMPLETED"
                    );

                    setIsGenerating(false);
                } else {
                    console.log(
                        "⏳ WEBSITE IS STILL GENERATING..."
                    );

                    setIsGenerating(true);
                }

            } catch (error: any) {
                console.error(
                    "❌ FETCH PROJECT ERROR:",
                    error
                );

                if (showError) {
                    toast.error(
                        error?.response?.data?.message ||
                        error?.message ||
                        "Failed to load project"
                    );
                }

            } finally {
                setLoading(false);
            }
        },
        [projectId]
    );

    // ==========================================================
    // AUTH + FIRST FETCH
    // ==========================================================

    useEffect(() => {
        if (isPending) {
            return;
        }

        if (!session?.user) {
            toast.error(
                "Please login to view your project"
            );

            navigate("/");

            return;
        }

        if (!projectId) {
            toast.error(
                "Project ID is missing"
            );

            navigate("/");

            return;
        }

        console.log(
            "🚀 PROJECT PAGE OPENED:",
            projectId
        );

        fetchProject(true);

    }, [
        session,
        isPending,
        projectId,
        navigate,
        fetchProject,
    ]);

    // ==========================================================
    // BACKGROUND POLLING
    // ==========================================================

    useEffect(() => {
        if (isPending) {
            return;
        }

        if (!session?.user) {
            return;
        }

        if (!projectId) {
            return;
        }

        // Website ready, no need to poll
        if (project?.current_code) {
            console.log(
                "🛑 STOPPING POLLING - WEBSITE READY"
            );

            return;
        }

        console.log(
            "🔄 STARTING PROJECT POLLING..."
        );

        const intervalId =
            window.setInterval(() => {
                console.log(
                    "🔄 CHECKING PROJECT STATUS..."
                );

                fetchProject(false);

            }, 2000);

        return () => {
            console.log(
                "🛑 CLEARING PROJECT POLLING"
            );

            window.clearInterval(
                intervalId
            );
        };

    }, [
        projectId,
        session,
        isPending,
        project?.current_code,
        fetchProject,
    ]);

    // ==========================================================
    // SAVE PROJECT
    // ==========================================================

    const saveProject = async () => {
        if (!projectId || !project) {
            toast.error(
                "Project not found"
            );

            return;
        }

        if (isGenerating) {
            toast.info(
                "Please wait until website generation is complete."
            );

            return;
        }

        try {
            setIsSaving(true);

            console.log(
                "========================================"
            );

            console.log(
                "💾 SAVING PROJECT"
            );

            console.log(
                "PROJECT ID:",
                projectId
            );

            // Get latest HTML from iframe.
            // This includes manual editor changes.
            const code =
                previewRef.current?.getCode() ||
                project.current_code;

            if (!code) {
                toast.error(
                    "No website code available"
                );

                return;
            }

            console.log(
                "💻 CODE LENGTH:",
                code.length
            );

            // IMPORTANT:
            // projectRouter:
            //
            // PUT /api/project/save/:projectId
            //
            const { data } =
                await api.put(
                    `/project/save/${projectId}`,
                    {
                        code,
                    }
                );

            console.log(
                "✅ SAVE RESPONSE:",
                data
            );

            // Update local project
            if (data?.project) {
                setProject(
                    data.project
                );
            } else {
                await fetchProject(false);
            }

            toast.success(
                data?.message ||
                "Project saved successfully!"
            );

            console.log(
                "🎉 PROJECT SAVED SUCCESSFULLY"
            );

            console.log(
                "========================================"
            );

        } catch (error: any) {
            console.error(
                "❌ SAVE PROJECT ERROR:",
                error
            );

            console.error(
                "❌ SERVER RESPONSE:",
                error?.response?.data
            );

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to save project"
            );

        } finally {
            setIsSaving(false);
        }
    };

    // ==========================================================
    // DOWNLOAD PROJECT CODE
    // ==========================================================

    const downloadCode = () => {
        try {
            console.log(
                "📥 DOWNLOADING PROJECT CODE..."
            );

            // Get latest code from iframe first.
            const code =
                previewRef.current?.getCode() ||
                project?.current_code;

            if (!code) {
                toast.error(
                    "No website code available"
                );

                return;
            }

            console.log(
                "💻 DOWNLOAD CODE LENGTH:",
                code.length
            );

            const blob =
                new Blob(
                    [code],
                    {
                        type:
                            "text/html;charset=utf-8",
                    }
                );

            const url =
                URL.createObjectURL(
                    blob
                );

            const anchor =
                document.createElement(
                    "a"
                );

            anchor.href = url;

            const fileName =
                project?.name
                    ?.replace(
                        /[^a-z0-9]/gi,
                        "-"
                    )
                    .replace(
                        /-+/g,
                        "-"
                    )
                    .replace(
                        /^-|-$/g,
                        ""
                    )
                    .toLowerCase() ||
                "website";

            anchor.download =
                `${fileName}.html`;

            document.body.appendChild(
                anchor
            );

            anchor.click();

            document.body.removeChild(
                anchor
            );

            URL.revokeObjectURL(
                url
            );

            toast.success(
                "Website code downloaded"
            );

            console.log(
                "✅ DOWNLOAD COMPLETED"
            );

        } catch (error) {
            console.error(
                "❌ DOWNLOAD ERROR:",
                error
            );

            toast.error(
                "Failed to download website"
            );
        }
    };

    // ==========================================================
    // PUBLISH / UNPUBLISH
    // ==========================================================

    const togglePublish = async () => {
        if (!projectId || !project) {
            toast.error(
                "Project not found"
            );

            return;
        }

        if (!project.current_code) {
            toast.info(
                "Generate the website first."
            );

            return;
        }

        try {
            setIsPublishing(true);

            console.log(
                "========================================"
            );

            console.log(
                "📢 TOGGLE PUBLISH"
            );

            console.log(
                "PROJECT ID:",
                projectId
            );

            // IMPORTANT:
            // userRouter:
            //
            // GET /api/user/publish-toggle/:projectId
            //
            const { data } =
                await api.get(
                    `/user/publish-toggle/${projectId}`
                );

            console.log(
                "✅ PUBLISH RESPONSE:",
                data
            );

            if (data?.project) {
                setProject(
                    data.project
                );
            } else {
                // Backend may only return a message.
                // Fetch latest project state.
                await fetchProject(false);
            }

            const published =
                data?.project?.isPublished ??
                !project.isPublished;

            toast.success(
                data?.message ||
                (
                    published
                        ? "Website published successfully"
                        : "Website unpublished successfully"
                )
            );

            console.log(
                "========================================"
            );

        } catch (error: any) {
            console.error(
                "❌ PUBLISH ERROR:",
                error
            );

            console.error(
                "❌ SERVER RESPONSE:",
                error?.response?.data
            );

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to update publish status"
            );

        } finally {
            setIsPublishing(false);
        }
    };

    // ==========================================================
    // INITIAL LOADING
    // ==========================================================

    if (
        isPending ||
        loading
    ) {
        return (
            <div
                className="
                    flex
                    items-center
                    justify-center
                    h-screen
                    bg-gray-900
                "
            >
                <div
                    className="
                        flex
                        flex-col
                        items-center
                        gap-3
                    "
                >
                    <Loader2Icon
                        className="
                            size-8
                            animate-spin
                            text-violet-400
                        "
                    />

                    <p
                        className="
                            text-sm
                            text-gray-400
                        "
                    >
                        Loading project...
                    </p>
                </div>
            </div>
        );
    }

    // ==========================================================
    // PROJECT NOT FOUND
    // ==========================================================

    if (!project) {
        return (
            <div
                className="
                    flex
                    flex-col
                    gap-4
                    items-center
                    justify-center
                    h-screen
                    bg-gray-900
                    text-white
                "
            >
                <p
                    className="
                        text-2xl
                        font-medium
                        text-gray-200
                    "
                >
                    Unable to Load Project...!
                </p>

                <button
                    onClick={() =>
                        navigate("/")
                    }
                    className="
                        px-4
                        py-2
                        rounded-md
                        bg-indigo-600
                        hover:bg-indigo-500
                        transition-colors
                    "
                >
                    Go Home
                </button>
            </div>
        );
    }

    // ==========================================================
    // PROJECT PAGE
    // ==========================================================

    return (
        <div
            className="
                flex
                flex-col
                h-screen
                w-full
                bg-gray-900
                text-white
            "
        >
            {/* ==================================================
                NAVBAR
            ================================================== */}

            <div
                className="
                    flex
                    max-sm:flex-col
                    sm:items-center
                    gap-4
                    px-4
                    py-2
                    no-scrollbar
                "
            >
                {/* ==================================================
                    LEFT
                ================================================== */}

                <div
                    className="
                        flex
                        items-center
                        gap-2
                        sm:min-w-90
                        text-nowrap
                    "
                >
                    <img
                        src="/favicon.svg"
                        alt="logo"
                        className="
                            h-6
                            cursor-pointer
                        "
                        onClick={() =>
                            navigate("/")
                        }
                    />

                    <div
                        className="
                            max-w-64
                            sm:max-w-xs
                        "
                    >
                        <p
                            className="
                                text-sm
                                font-medium
                                capitalize
                                truncate
                            "
                        >
                            {project.name}
                        </p>

                        <p
                            className="
                                text-xs
                                text-gray-400
                                -mt-0.5
                            "
                        >
                            {isGenerating
                                ? "Generating your website..."
                                : "Previewing last saved version"}
                        </p>
                    </div>

                    {/* MOBILE MENU */}

                    <div
                        className="
                            sm:hidden
                            flex-1
                            flex
                            justify-end
                        "
                    >
                        {isMenuOpen ? (
                            <XIcon
                                onClick={() =>
                                    setIsMenuOpen(
                                        false
                                    )
                                }
                                className="
                                    size-6
                                    cursor-pointer
                                "
                            />
                        ) : (
                            <MessageSquareIcon
                                onClick={() =>
                                    setIsMenuOpen(
                                        true
                                    )
                                }
                                className="
                                    size-6
                                    cursor-pointer
                                "
                            />
                        )}
                    </div>
                </div>

                {/* ==================================================
                    DEVICE SELECTOR
                ================================================== */}

                <div
                    className="
                        hidden
                        sm:flex
                        gap-2
                        bg-gray-950
                        p-1.5
                        rounded-md
                    "
                >
                    <SmartphoneIcon
                        onClick={() =>
                            setDevice("phone")
                        }
                        className={`
                            size-6
                            p-1
                            rounded
                            cursor-pointer
                            ${
                                device === "phone"
                                    ? "bg-gray-700"
                                    : ""
                            }
                        `}
                    />

                    <TabletIcon
                        onClick={() =>
                            setDevice("tablet")
                        }
                        className={`
                            size-6
                            p-1
                            rounded
                            cursor-pointer
                            ${
                                device === "tablet"
                                    ? "bg-gray-700"
                                    : ""
                            }
                        `}
                    />

                    <LaptopIcon
                        onClick={() =>
                            setDevice("desktop")
                        }
                        className={`
                            size-6
                            p-1
                            rounded
                            cursor-pointer
                            ${
                                device === "desktop"
                                    ? "bg-gray-700"
                                    : ""
                            }
                        `}
                    />
                </div>

                {/* ==================================================
                    RIGHT ACTIONS
                ================================================== */}

                <div
                    className="
                        flex
                        items-center
                        justify-end
                        gap-3
                        flex-1
                        text-xs
                        sm:text-sm
                    "
                >
                    {/* ==================================================
                        SAVE
                    ================================================== */}

                    <button
                        type="button"
                        onClick={saveProject}
                        disabled={
                            isSaving ||
                            isGenerating
                        }
                        className="
                            max-sm:hidden
                            bg-gray-800
                            hover:bg-gray-700
                            text-white
                            px-3
                            py-1
                            flex
                            items-center
                            gap-2
                            rounded
                            sm:rounded-sm
                            transition-colors
                            border
                            border-gray-700
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                        "
                    >
                        {isSaving ? (
                            <Loader2Icon
                                className="animate-spin"
                                size={16}
                            />
                        ) : (
                            <SaveIcon
                                size={16}
                            />
                        )}

                        {isSaving
                            ? "Saving..."
                            : "Save"}
                    </button>

                    {/* ==================================================
                        PREVIEW
                    ================================================== */}

                    <Link
                        target="_blank"
                        rel="noopener noreferrer"
                        to={`/preview/${projectId}`}
                        className="
                            flex
                            items-center
                            gap-2
                            px-4
                            py-1
                            rounded
                            sm:rounded-sm
                            border
                            border-gray-700
                            hover:border-gray-500
                            transition-colors
                        "
                    >
                        <FullscreenIcon
                            size={16}
                        />

                        Preview
                    </Link>

                    {/* ==================================================
                        DOWNLOAD
                    ================================================== */}

                    <button
                        type="button"
                        onClick={
                            downloadCode
                        }
                        disabled={
                            !project.current_code ||
                            isGenerating
                        }
                        className="
                            bg-linear-to-br
                            from-blue-700
                            to-blue-600
                            hover:from-blue-600
                            hover:to-blue-500
                            text-white
                            px-3.5
                            py-1
                            flex
                            items-center
                            gap-2
                            rounded
                            sm:rounded-sm
                            transition-colors
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                        "
                    >
                        <ArrowBigDownDashIcon
                            size={16}
                        />

                        Download
                    </button>

                    {/* ==================================================
                        PUBLISH
                    ================================================== */}

                    <button
                        type="button"
                        onClick={
                            togglePublish
                        }
                        disabled={
                            !project.current_code ||
                            isGenerating ||
                            isPublishing
                        }
                        className="
                            bg-linear-to-br
                            from-indigo-700
                            to-indigo-600
                            hover:from-indigo-600
                            hover:to-indigo-500
                            text-white
                            px-3.5
                            py-1
                            flex
                            items-center
                            gap-2
                            rounded
                            sm:rounded-sm
                            transition-colors
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                        "
                    >
                        {isPublishing ? (
                            <Loader2Icon
                                size={16}
                                className="animate-spin"
                            />
                        ) : project.isPublished ? (
                            <EyeOffIcon
                                size={16}
                            />
                        ) : (
                            <EyeIcon
                                size={16}
                            />
                        )}

                        {isPublishing
                            ? "Updating..."
                            : project.isPublished
                                ? "Unpublish"
                                : "Publish"}
                    </button>
                </div>
            </div>

            {/* ==================================================
                MAIN
            ================================================== */}

            <div
                className="
                    flex-1
                    flex
                    overflow-auto
                "
            >
                {/* ==================================================
                    SIDEBAR
                ================================================== */}

                <Sidebar
                    isMenuOpen={
                        isMenuOpen
                    }
                    project={
                        project
                    }
                    setProject={
                        (
                            updatedProject: Project
                        ) =>
                            setProject(
                                updatedProject
                            )
                    }
                    isGenerating={
                        isGenerating
                    }
                    setIsGenerating={
                        setIsGenerating
                    }
                />

                {/* ==================================================
                    PREVIEW
                ================================================== */}

                <div
                    className="
                        flex-1
                        p-2
                        pl-0
                    "
                >
                    <ProjectPreview
                        ref={previewRef}
                        project={
                            project
                        }
                        isGenerating={
                            isGenerating
                        }
                        device={
                            device
                        }
                    />
                </div>
            </div>
        </div>
    );
};

export default Projects;