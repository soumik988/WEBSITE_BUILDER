import { useEffect, useState } from "react";
import type { Project } from "../types";
import { Loader2Icon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Fotter from "../components/Fotter";
import api from "@/configs/axios";
import { toast } from "sonner";

const Community = () => {
    const [loading, setLoading] =
        useState(true);

    const [projects, setProjects] =
        useState<Project[]>([]);

    const navigate = useNavigate();

    // ======================================================
    // FETCH PUBLISHED PROJECTS
    // ======================================================

    const fetchProjects = async () => {
        try {
            setLoading(true);

            console.log(
                "📡 FETCHING PUBLISHED PROJECTS..."
            );

            const { data } =
                await api.get(
                    "/project/published"
                );

            console.log(
                "✅ PUBLISHED PROJECTS RESPONSE:",
                data
            );

            const publishedProjects =
                data?.projects ||
                data?.project ||
                [];

            if (
                Array.isArray(
                    publishedProjects
                )
            ) {
                setProjects(
                    publishedProjects
                );

                console.log(
                    "📦 PUBLISHED PROJECT COUNT:",
                    publishedProjects.length
                );
            } else {
                setProjects([]);
            }

        } catch (error: any) {
            console.error(
                "❌ FETCH PUBLISHED PROJECTS ERROR:",
                error
            );

            console.error(
                "❌ SERVER RESPONSE:",
                error?.response?.data
            );

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to load published projects"
            );

            setProjects([]);

        } finally {
            setLoading(false);
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
                                Published Projects
                            </h1>
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
                                    <Link
                                        key={
                                            project.id
                                        }
                                        to={`/view/${project.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="
                                            w-72
                                            max-sm:mx-auto
                                            cursor-pointer
                                            bg-gray-900/60
                                            border
                                            border-gray-700
                                            rounded-lg
                                            overflow-hidden
                                            group
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

                                                <span
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
                                                </span>
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
                                                USER + DATE
                                            ================================================== */}

                                            <div
                                                className="
                                                    flex
                                                    justify-between
                                                    items-center
                                                    mt-6
                                                    gap-3
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
                                                    <span
                                                        className="
                                                            px-3
                                                            py-1.5
                                                            bg-white/10
                                                            rounded-md
                                                            flex
                                                            items-center
                                                            gap-2
                                                        "
                                                    >
                                                        <span
                                                            className="
                                                                bg-gray-200
                                                                size-4.5
                                                                rounded-full
                                                                text-black
                                                                font-semibold
                                                                flex
                                                                items-center
                                                                justify-center
                                                            "
                                                        >
                                                            {project.user?.name
                                                                ?.slice(
                                                                    0,
                                                                    1
                                                                )
                                                                ?.toUpperCase() ||
                                                                "U"}
                                                        </span>

                                                        {project
                                                            .user
                                                            ?.name ||
                                                            "User"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            )}
                        </div>
                    </div>
                ) : (
                    // ======================================================
                    // NO PUBLISHED PROJECTS
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
                            No Published Projects Yet !!
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

export default Community;