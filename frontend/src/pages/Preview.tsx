

/*import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import { dummyProjects } from '../assets/assets';
import { Loader2Icon } from 'lucide-react';
import type { Project } from '../types';
import ProjectPreview from '../components/ProjectPreview';

const Preview = () => {

  const { projectId, versionId } = useParams()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true);

  const fetchCode = async () => {

    setTimeout(() => {
      const code = dummyProjects.find(project => project.id === projectId)?.current_code;
      if (code) {
        setCode(code);
        setLoading(false)
      }

    }, 2000)
  }

  useEffect(() => {
    fetchCode()
  }, [])

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loader2Icon className='size-7 animate-spin text-indigo-200' />
      </div>
    )
  }

  return (
    <div className='h-screen  '>
      {code && <ProjectPreview project={{ current_code: code } as Project} isGenerating={false} showEditorPanel={false} />}

    </div>
  )
}

export default Preview*/





import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2Icon, ArrowLeftIcon } from "lucide-react";
import type { Project } from "../types";
import ProjectPreview from "../components/ProjectPreview";
import api from "@/configs/axios";
import { toast } from "sonner";

const Preview = () => {
    const {
        projectId,
        versionId,
    } = useParams<{
        projectId: string;
        versionId?: string;
    }>();

    const navigate = useNavigate();

    const [project, setProject] =
        useState<Project | null>(null);

    const [loading, setLoading] =
        useState(true);

    const fetchCode = async () => {
        if (!projectId) {
            toast.error(
                "Project ID is missing"
            );

            setLoading(false);

            return;
        }

        try {
            console.log(
                "👀 FETCHING PREVIEW:",
                projectId
            );

            console.log(
                "📦 VERSION:",
                versionId || "CURRENT VERSION"
            );

            // ==================================================
            // GET PROJECT FROM BACKEND
            // ==================================================

            const { data } =
                await api.get(
                    `/project/preview/${projectId}`
                );

            console.log(
                "✅ PREVIEW RESPONSE:",
                data
            );

            const backendProject =
                data?.project;

            if (!backendProject) {
                throw new Error(
                    "Project not found"
                );
            }

            // ==================================================
            // VERSION PREVIEW
            // ==================================================

            let previewProject =
                backendProject;

            if (
                versionId &&
                Array.isArray(
                    backendProject.versions
                )
            ) {
                const version =
                    backendProject.versions.find(
                        (item: any) =>
                            item.id === versionId
                    );

                if (!version) {
                    throw new Error(
                        "Version not found"
                    );
                }

                previewProject = {
                    ...backendProject,

                    current_code:
                        version.code,

                    current_version_index:
                        version.id,
                };
            }

            // ==================================================
            // CHECK CODE
            // ==================================================

            if (
                !previewProject.current_code
            ) {
                throw new Error(
                    "Website code is not available"
                );
            }

            console.log(
                "💻 PREVIEW CODE LENGTH:",
                previewProject
                    .current_code.length
            );

            setProject(
                previewProject
            );

        } catch (error: any) {

            console.error(
                "❌ PREVIEW ERROR:",
                error
            );

            console.error(
                "❌ SERVER RESPONSE:",
                error?.response?.data
            );

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to load preview"
            );

        } finally {
            setLoading(false);
        }
    };

    // ==========================================================
    // FETCH ON LOAD
    // ==========================================================

    useEffect(() => {
        fetchCode();
    }, [
        projectId,
        versionId,
    ]);

    // ==========================================================
    // LOADING
    // ==========================================================

    if (loading) {
        return (
            <div
                className="
                    flex
                    flex-col
                    items-center
                    justify-center
                    h-screen
                    bg-gray-900
                    text-white
                    gap-3
                "
            >
                <Loader2Icon
                    className="
                        size-8
                        animate-spin
                        text-indigo-400
                    "
                />

                <p
                    className="
                        text-sm
                        text-gray-400
                    "
                >
                    Loading preview...
                </p>
            </div>
        );
    }

    // ==========================================================
    // NO PROJECT
    // ==========================================================

    if (!project) {
        return (
            <div
                className="
                    flex
                    flex-col
                    items-center
                    justify-center
                    h-screen
                    bg-gray-900
                    text-white
                    gap-4
                "
            >
                <p
                    className="
                        text-lg
                        text-gray-300
                    "
                >
                    Unable to load website preview.
                </p>

                <button
                    onClick={() =>
                        navigate(-1)
                    }
                    className="
                        flex
                        items-center
                        gap-2
                        px-4
                        py-2
                        rounded-md
                        bg-indigo-600
                        hover:bg-indigo-500
                        transition-colors
                    "
                >
                    <ArrowLeftIcon
                        size={16}
                    />

                    Go Back
                </button>
            </div>
        );
    }

    // ==========================================================
    // PREVIEW
    // ==========================================================

    return (
        <div
            className="
                relative
                h-screen
                w-full
                bg-gray-900
                overflow-hidden
            "
        >
            {/* ==================================================
                TOP BAR
            ================================================== */}

            <div
                className="
                    absolute
                    top-3
                    left-3
                    z-50
                    flex
                    items-center
                    gap-3
                "
            >
                <button
                    onClick={() =>
                        navigate(-1)
                    }
                    className="
                        flex
                        items-center
                        gap-2
                        bg-gray-900/90
                        backdrop-blur
                        border
                        border-gray-700
                        text-white
                        px-3
                        py-2
                        rounded-md
                        hover:bg-gray-800
                        transition-colors
                    "
                >
                    <ArrowLeftIcon
                        size={16}
                    />

                    Back
                </button>

                {versionId && (
                    <div
                        className="
                            bg-gray-900/90
                            backdrop-blur
                            border
                            border-gray-700
                            text-gray-300
                            px-3
                            py-2
                            rounded-md
                            text-xs
                        "
                    >
                        Version Preview
                    </div>
                )}
            </div>

            {/* ==================================================
                WEBSITE
            ================================================== */}

            <ProjectPreview
                project={
                    project
                }
                isGenerating={false}
                showEditorPanel={false}
            />
        </div>
    );
};

export default Preview;