import { useEffect, useState } from "react";
import type { Project } from "../types";
import {
    Loader2Icon,
    PlusIcon,
    TrashIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Fotter from "../components/Fotter";
import api from "@/configs/axios";
import { toast } from "sonner";

const MyProjects = () => {
    const [loading, setLoading] =
        useState(true);

    const [projects, setProjects] =
        useState<Project[]>([]);

    const navigate = useNavigate();

    // ======================================================
    // FETCH PROJECTS FROM DATABASE
    // ======================================================

    const fetchProjects = async () => {
        try {
            setLoading(true);

            console.log(
                "📡 FETCHING USER PROJECTS..."
            );

            const { data } =
                await api.get(
                    "/user/projects"
                );

            console.log(
                "✅ PROJECTS RESPONSE:",
                data
            );

            const userProjects =
                data?.projects ||
                data?.project ||
                [];

            setProjects(
                Array.isArray(userProjects)
                    ? userProjects
                    : []
            );

            console.log(
                "📦 PROJECT COUNT:",
                Array.isArray(userProjects)
                    ? userProjects.length
                    : 0
            );

        } catch (error: any) {
            console.error(
                "❌ FETCH PROJECTS ERROR:",
                error
            );

            console.error(
                "❌ SERVER RESPONSE:",
                error?.response?.data
            );

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to load projects"
            );

            setProjects([]);

        } finally {
            setLoading(false);
        }
    };

    // ======================================================
    // DELETE PROJECT
    // ======================================================

    const deleteProject = async (
        projectId: string
    ) => {
        try {
            const confirmed =
                window.confirm(
                    "Are you sure you want to delete this project?"
                );

            if (!confirmed) {
                return;
            }

            console.log(
                "🗑️ DELETING PROJECT:",
                projectId
            );

            await api.delete(
                `/project/${projectId}`
            );

            console.log(
                "✅ PROJECT DELETED"
            );

            // Remove immediately from UI
            setProjects((prev) =>
                prev.filter(
                    (project) =>
                        project.id !== projectId
                )
            );

            toast.success(
                "Project deleted successfully"
            );

        } catch (error: any) {
            console.error(
                "❌ DELETE PROJECT ERROR:",
                error
            );

            console.error(
                "❌ SERVER RESPONSE:",
                error?.response?.data
            );

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to delete project"
            );
        }
    };

    // ======================================================
    // LOAD PROJECTS
    // ======================================================

    useEffect(() => {
        fetchProjects();
    }, []);

    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {
        return (
            <>
                <div
                    className="
                        flex
                        items-center
                        justify-center
                        h-[80vh]
                    "
                >
                    <Loader2Icon
                        className="
                            size-7
                            animate-spin
                            text-indigo-200
                        "
                    />
                </div>

                <Fotter />
            </>
        );
    }

    // ======================================================
    // PAGE
    // ======================================================

    return (
        <>
            <div
                className="
                    px-4
                    md:px-16
                    lg:px-24
                    xl:px-32
                "
            >
                {projects.length > 0 ? (
                    <div
                        className="
                            py-10
                            min-h-[80vh]
                        "
                    >
                        {/* ==================================================
                            HEADER
                        ================================================== */}

                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                mb-12
                            "
                        >
                            <h1
                                className="
                                    text-2xl
                                    font-medium
                                    text-white
                                "
                            >
                                My Projects
                            </h1>

                            <button
                                onClick={() =>
                                    navigate("/")
                                }
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    text-white
                                    px-3
                                    sm:px-6
                                    py-1
                                    sm:py-2
                                    rounded
                                    bg-linear-to-br
                                    from-red-900
                                    to-yellow-900
                                    hover:opacity-90
                                    active:scale-95
                                    transition-all
                                "
                            >
                                <PlusIcon
                                    size={18}
                                />

                                Create New
                            </button>
                        </div>

                        {/* ==================================================
                            PROJECT GRID
                        ================================================== */}

                        <div
                            className="
                                flex
                                flex-wrap
                                gap-3.5
                            "
                        >
                            {projects.map(
                                (project) => (
                                    <div
                                        onClick={() =>
                                            navigate(
                                                `/projects/${project.id}`
                                            )
                                        }
                                        key={
                                            project.id
                                        }
                                        className="
                                            relative
                                            group
                                            w-72
                                            max-sm:mx-auto
                                            cursor-pointer
                                            bg-gray-900/60
                                            border
                                            border-gray-700
                                            rounded-lg
                                            overflow-hidden
                                            shadow-md
                                            hover:shadow-indigo-700/30
                                            hover:border-indigo-800/30
                                            transition-all
                                            duration-300
                                        "
                                    >
                                        {/* ==================================================
                                            PREVIEW
                                        ================================================== */}

                                        <div
                                            className="
                                                relative
                                                w-full
                                                h-40
                                                bg-gray-900
                                                overflow-hidden
                                                border-b
                                                border-gray-900
                                            "
                                        >
                                            {project.current_code ? (
                                                <iframe
                                                    srcDoc={
                                                        project.current_code
                                                    }
                                                    title={
                                                        project.name
                                                    }
                                                    className="
                                                        absolute
                                                        top-0
                                                        left-0
                                                        w-300
                                                        h-200
                                                        origin-top-left
                                                        pointer-events-none
                                                    "
                                                    sandbox="
                                                        allow-scripts
                                                        allow-same-origin
                                                    "
                                                    style={{
                                                        transform:
                                                            "scale(0.25)",
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    className="
                                                        flex
                                                        items-center
                                                        justify-center
                                                        h-full
                                                        text-gray-500
                                                    "
                                                >
                                                    <p>
                                                        No Preview
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* ==================================================
                                            CONTENT
                                        ================================================== */}

                                        <div
                                            className="
                                                p-4
                                                text-white
                                                bg-linear-180
                                                from-transparent
                                                group-hover:from-indigo-950
                                                to-transparent
                                                transition-colors
                                            "
                                        >
                                            <div
                                                className="
                                                    flex
                                                    items-start
                                                    justify-between
                                                "
                                            >
                                                <h2
                                                    className="
                                                        text-lg
                                                        font-medium
                                                        line-clamp-2
                                                    "
                                                >
                                                    {
                                                        project.name
                                                    }
                                                </h2>

                                                <button
                                                    type="button"
                                                    onClick={(
                                                        e
                                                    ) =>
                                                        e.stopPropagation()
                                                    }
                                                    className="
                                                        px-2.5
                                                        py-0.5
                                                        mt-1
                                                        ml-2
                                                        text-xs
                                                        bg-gray-800
                                                        border
                                                        border-gray-700
                                                        rounded-full
                                                        shrink-0
                                                    "
                                                >
                                                    Website
                                                </button>
                                            </div>

                                            <p
                                                className="
                                                    text-gray-400
                                                    mt-1
                                                    text-sm
                                                    line-clamp-2
                                                "
                                            >
                                                {
                                                    project.initial_prompt
                                                }
                                            </p>

                                            {/* ==================================================
                                                ACTIONS
                                            ================================================== */}

                                            <div
                                                onClick={(
                                                    e
                                                ) =>
                                                    e.stopPropagation()
                                                }
                                                className="
                                                    flex
                                                    justify-between
                                                    items-center
                                                    mt-6
                                                "
                                            >
                                                <span
                                                    className="
                                                        text-xs
                                                        text-gray-400
                                                    "
                                                >
                                                    {project.createdAt
                                                        ? new Date(
                                                              project.createdAt
                                                          ).toLocaleDateString()
                                                        : ""}
                                                </span>

                                                <div
                                                    className="
                                                        flex
                                                        gap-3
                                                        text-white
                                                        text-sm
                                                    "
                                                >
                                                    {/* PREVIEW */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(
                                                                `/preview/${project.id}`
                                                            )
                                                        }
                                                        className="
                                                            px-3
                                                            py-1.5
                                                            bg-white/10
                                                            hover:bg-white/15
                                                            rounded-md
                                                            transition-all
                                                        "
                                                    >
                                                        Preview
                                                    </button>

                                                    {/* OPEN */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(
                                                                `/projects/${project.id}`
                                                            )
                                                        }
                                                        className="
                                                            px-3
                                                            py-1.5
                                                            bg-white/10
                                                            hover:bg-white/15
                                                            rounded-md
                                                            transition-colors
                                                        "
                                                    >
                                                        Open
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ==================================================
                                            DELETE
                                        ================================================== */}

                                        <div
                                            onClick={(
                                                e
                                            ) =>
                                                e.stopPropagation()
                                            }
                                        >
                                            <button
                                                type="button"
                                                aria-label="Delete project"
                                                onClick={() =>
                                                    deleteProject(
                                                        project.id
                                                    )
                                                }
                                                className="
                                                    absolute
                                                    top-3
                                                    right-3
                                                    scale-0
                                                    group-hover:scale-100
                                                    bg-white
                                                    p-1.5
                                                    size-7
                                                    rounded
                                                    text-red-500
                                                    cursor-pointer
                                                    transition-all
                                                    hover:bg-red-50
                                                "
                                            >
                                                <TrashIcon
                                                    className="
                                                        size-full
                                                    "
                                                />
                                            </button>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                ) : (
                    // ======================================================
                    // NO PROJECTS
                    // ======================================================

                    <div
                        className="
                            flex
                            flex-col
                            items-center
                            justify-center
                            h-[80vh]
                        "
                    >
                        <h1
                            className="
                                text-3xl
                                font-semibold
                                text-gray-300
                            "
                        >
                            You Have No Projects Yet !!
                        </h1>

                        <button
                            onClick={() =>
                                navigate("/")
                            }
                            className="
                                text-white
                                px-5
                                py-2
                                mt-5
                                rounded-md
                                bg-indigo-500
                                hover:bg-indigo-600
                                active:scale-95
                                transition-all
                            "
                        >
                            Create New
                        </button>
                    </div>
                )}
            </div>

            <Fotter />
        </>
    );
};

export default MyProjects;