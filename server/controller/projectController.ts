import { Request, Response } from "express";
import prisma from "../liib/prisma.js";
import openai from "../configs/openai.js";

// ======================================================
// AI HELPER
// ======================================================

const callAIWithRetry = async (
    request: any,
    options: any = {},
    retries = 2
) => {
    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            console.log(
                `🤖 AI REQUEST ATTEMPT ${attempt + 1}/${retries + 1}`
            );

            return await openai.chat.completions.create(
                request,
                options
            );
        } catch (error: any) {
            lastError = error;

            console.error(
                `❌ AI ATTEMPT ${attempt + 1} FAILED:`,
                error?.message
            );

            const status =
                error?.status ||
                error?.response?.status;

            if (
                status !== 429 ||
                attempt >= retries
            ) {
                throw error;
            }

            const retryAfter =
                Number(
                    error?.headers?.get?.("retry-after")
                ) || 3;

            await new Promise((resolve) =>
                setTimeout(
                    resolve,
                    retryAfter * 1000
                )
            );
        }
    }

    throw lastError;
};

// ======================================================
// CLEAN HTML
// ======================================================

const cleanAIHtml = (rawCode: string): string => {
    if (!rawCode) {
        return "";
    }

    let html = rawCode.trim();

    html = html
        .replace(/^```html\s*/i, "")
        .replace(/^```HTML\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    const htmlStart = html.search(/<html[\s>]/i);

    if (htmlStart !== -1) {
        html = html.substring(htmlStart).trim();
    }

    const htmlEnd = html.search(/<\/html>/i);

    if (htmlEnd !== -1) {
        html = html
            .substring(
                0,
                htmlEnd + "</html>".length
            )
            .trim();
    }

    if (
        /<body[\s>]/i.test(html) &&
        !/<\/body>/i.test(html)
    ) {
        html += "\n</body>";
    }

    if (
        /<html[\s>]/i.test(html) &&
        !/<\/html>/i.test(html)
    ) {
        html += "\n</html>";
    }

    return html.trim();
};

// ======================================================
// HTML VALIDATION
// ======================================================

const isValidHTML = (html: string): boolean => {
    if (!html) {
        return false;
    }

    return (
        /<html[\s>]/i.test(html) &&
        /<head[\s>]/i.test(html) &&
        /<body[\s>]/i.test(html) &&
        /<\/body>/i.test(html) &&
        /<\/html>/i.test(html)
    );
};

// ======================================================
// MAKE REVISION
// ======================================================

export const makeRevision = async (
    req: Request,
    res: Response
) => {
    const userId = req.userId;

    try {
        const projectId =
            req.params.projectId as string;

        const { message } = req.body;

        // ==================================================
        // AUTH
        // ==================================================

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        // ==================================================
        // VALIDATE MESSAGE
        // ==================================================

        if (
            !message ||
            typeof message !== "string" ||
            !message.trim()
        ) {
            return res.status(400).json({
                message:
                    "Please enter a valid revision request",
            });
        }

        // ==================================================
        // GET USER
        // ==================================================

        const user =
            await prisma.user.findUnique({
                where: {
                    id: userId,
                },
            });

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        // ==================================================
        // CREDIT CHECK
        // ==================================================

        if (user.credits < 5) {
            return res.status(403).json({
                message:
                    "Add more credits to make changes",
            });
        }

        // ==================================================
        // GET PROJECT
        // ==================================================

        const currentProject =
            await prisma.websiteProject.findFirst({
                where: {
                    id: projectId,
                    userId,
                },

                include: {
                    versions: true,
                },
            });

        if (!currentProject) {
            return res.status(404).json({
                message: "Project not found",
            });
        }

        if (!currentProject.current_code) {
            return res.status(400).json({
                message:
                    "Website code is not available yet",
            });
        }

        // ==================================================
        // SAVE USER MESSAGE
        // ==================================================

        await prisma.conversation.create({
            data: {
                role: "user",
                content: message.trim(),
                projectId,
            },
        });

        // ==================================================
        // DEDUCT 5 CREDITS
        // ==================================================

        await prisma.user.update({
            where: {
                id: userId,
            },

            data: {
                credits: {
                    decrement: 5,
                },
            },
        });

        let success = false;

        try {
            // ==================================================
            // PROMPT ENHANCEMENT
            // ==================================================

            console.log(
                "1️⃣ AI PROMPT START"
            );

            const promptEnhanceResponse =
                await callAIWithRetry(
                    {
                        model: "nvidia/nemotron-3-nano-30b-a3b:free",

                        messages: [
                            {
                                role: "system",

                                content: `
You are a professional website revision prompt enhancer.

The user wants to modify an existing website.

Rewrite the user's request into a clear and actionable instruction for an expert web developer.

Clearly identify:
- what should change
- where it should change
- colors
- spacing
- sizing
- layout
- behavior
- animation if requested

Preserve the user's original intent.

Do not request unrelated changes.

Return ONLY the enhanced request.
No markdown.
No explanation.

For long requests, preserve ALL important requirements.
`,
                            },

                            {
                                role: "user",

                                content:
                                    message.trim(),
                            },
                        ],

                        temperature: 0.2,

                        max_tokens: 1500,
                    },

                    {
                        timeout: 60000,
                    },

                    2
                );

            let enhancedPrompt =
                promptEnhanceResponse
                    ?.choices?.[0]
                    ?.message?.content
                    ?.trim() || "";

            console.log(
                "📝 ENHANCED PROMPT LENGTH:",
                enhancedPrompt.length
            );

            // IMPORTANT FALLBACK
            if (!enhancedPrompt) {
                console.log(
                    "⚠️ ENHANCEMENT EMPTY - USING ORIGINAL REQUEST"
                );

                enhancedPrompt =
                    message.trim();
            }

            // ==================================================
            // SAVE ENHANCED PROMPT
            // ==================================================

            await prisma.conversation.create({
                data: {
                    role: "assistant",

                    content:
                        `I have enhanced your prompt to: "${enhancedPrompt}"`,

                    projectId,
                },
            });

            console.log(
                "2️⃣ WEBSITE CODE START"
            );

            // ==================================================
            // GENERATE UPDATED WEBSITE
            // ==================================================

            const codeGenerationResponse =
                await callAIWithRetry(
                    {
                        model:
                            "nvidia/nemotron-3-super-120b-a12b:free",

                        messages: [
                            {
                                role: "system",

                                content: `
You are an expert frontend developer.

Modify the EXISTING website according to the user's request.

IMPORTANT:

1. Do NOT recreate the website from scratch.
2. Preserve the existing design.
3. Preserve all unrelated sections.
4. Make ONLY the requested changes.
5. Return a COMPLETE HTML document.
6. Return ONLY HTML.
7. Do NOT use markdown.
8. Do NOT use code fences.
9. Do NOT explain anything.

The final document MUST contain:

<html>
<head>
</head>
<body>
</body>
</html>

Use Tailwind CSS.

Include:

<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>

JavaScript must remain valid.

Never use a variable before initialization.

Do not introduce:

ReferenceError
TypeError
SyntaxError

If changing colors, use valid CSS colors.

For <input type="color"> always use hexadecimal values such as:

#ffffff

Never use:

rgba(...)
rgb(...)
oklch(...)
var(...)

Preserve existing JavaScript unless the requested change requires it.

Return ONLY the complete updated HTML.
`,
                            },

                            {
                                role: "user",

                                content: `
CURRENT WEBSITE:

${currentProject.current_code}

USER REQUEST:

${enhancedPrompt}

Modify ONLY what the user requested.

Return the complete updated HTML.
`,
                            },
                        ],

                        temperature: 0.1,

                        max_tokens: 24000,
                    },

                    {
                        timeout: 180000,
                    },

                    2
                );

            console.log(
                "3️⃣ WEBSITE CODE DONE"
            );

            // ==================================================
            // GET CODE
            // ==================================================

            const rawCode =
                codeGenerationResponse
                    ?.choices?.[0]
                    ?.message?.content
                    ?.trim() || "";

            console.log(
                "📝 RAW CONTENT LENGTH:",
                rawCode.length
            );

            if (!rawCode) {
                throw new Error(
                    "AI returned empty website code"
                );
            }

            // ==================================================
            // CLEAN CODE
            // ==================================================

            const cleanCode =
                cleanAIHtml(rawCode);

            console.log(
                "🧹 CLEAN CODE LENGTH:",
                cleanCode.length
            );

            // ==================================================
            // VALIDATE CODE
            // ==================================================

            if (!isValidHTML(cleanCode)) {
                throw new Error(
                    "AI returned invalid or incomplete HTML"
                );
            }

            console.log(
                "✅ VALID HTML RECEIVED"
            );

            // ==================================================
            // CREATE VERSION
            // ==================================================

            const newVersion =
                await prisma.version.create({
                    data: {
                        code: cleanCode,

                        description:
                            message.trim(),

                        projectId,
                    },
                });

            console.log(
                "✅ NEW VERSION CREATED:",
                newVersion.id
            );

            // ==================================================
            // UPDATE PROJECT
            // ==================================================

            await prisma.websiteProject.update({
                where: {
                    id: projectId,
                },

                data: {
                    current_code:
                        cleanCode,

                    current_version_index:
                        newVersion.id,
                },
            });

            console.log(
                "✅ PROJECT CODE UPDATED"
            );

            // ==================================================
            // SAVE SUCCESS MESSAGE
            // ==================================================

            await prisma.conversation.create({
                data: {
                    role: "assistant",

                    content:
                        "I have made the changes to your website. You can now preview it.",

                    projectId,
                },
            });

            success = true;

            console.log(
                "🎉 REVISION SUCCESS"
            );

            return res.json({
                message:
                    "Changes made successfully",

                versionId:
                    newVersion.id,

                code:
                    cleanCode,
            });

        } catch (error: any) {

            console.error(
                "❌ REVISION AI ERROR:",
                error?.message
            );

            // ==================================================
            // REFUND 5 CREDITS
            // ==================================================

            if (!success) {
                await prisma.user.update({
                    where: {
                        id: userId,
                    },

                    data: {
                        credits: {
                            increment: 5,
                        },
                    },
                });

                console.log(
                    "💳 5 CREDITS REFUNDED"
                );
            }

            await prisma.conversation.create({
                data: {
                    role: "assistant",

                    content:
                        "Unable to update the website. Your credits have been refunded. Please try again.",

                    projectId,
                },
            });

            return res.status(500).json({
                message:
                    error?.message ||
                    "Failed to update website",
            });
        }

    } catch (error: any) {

        console.error(
            "🔥 REVISION ERROR:",
            error
        );

        return res.status(500).json({
            message:
                error?.message ||
                "Failed to make revision",
        });
    }
};

// ======================================================
// ROLLBACK TO VERSION
// ======================================================

export const rollbackToVersion = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const projectId = req.params.projectId as string;
        const versionId = req.params.versionId as string;

        // Get project owned by current user
        const project = await prisma.websiteProject.findFirst({
            where: {
                id: projectId,
                userId,
            },
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found",
            });
        }

        // Find selected version
        const selectedVersion = await prisma.version.findFirst({
            where: {
                id: versionId,
                projectId: projectId,
            },
        });

        if (!selectedVersion) {
            return res.status(404).json({
                message: "Version not found",
            });
        }

        if (!selectedVersion.code) {
            return res.status(400).json({
                message: "Selected version has no code",
            });
        }

        // Rollback project
        await prisma.websiteProject.update({
            where: {
                id: projectId,
            },
            data: {
                current_code: selectedVersion.code,
                current_version_index: selectedVersion.id,
            },
        });

        // Save rollback conversation
        await prisma.conversation.create({
            data: {
                role: "assistant",
                content:
                    "I have rolled back your website to the selected version. You can now preview it.",
                projectId,
            },
        });

        console.log("========================================");
        console.log("↩️ PROJECT ROLLBACK SUCCESS");
        console.log("PROJECT ID:", projectId);
        console.log("VERSION ID:", selectedVersion.id);
        console.log("CODE LENGTH:", selectedVersion.code.length);
        console.log("========================================");

        return res.json({
            message: "Version rolled back successfully",
            versionId: selectedVersion.id,
            code: selectedVersion.code,
        });
    } catch (error: any) {
        console.error("❌ ROLLBACK ERROR:", error);

        return res.status(500).json({
            message:
                error?.message ||
                "Failed to rollback project",
        });
    }
};

// ======================================================
// DELETE PROJECT
// ======================================================

export const deletProject = async (
    req: Request,
    res: Response
) => {

    try {

        const userId =
            req.userId;

        if (!userId) {
            return res.status(401).json({
                message:
                    "Unauthorized",
            });
        }

        const projectId =
            req.params.projectId as string;

        // ==================================================
        // CHECK PROJECT
        // ==================================================

        const project =
            await prisma.websiteProject.findFirst({
                where: {
                    id: projectId,
                    userId,
                },
            });

        if (!project) {
            return res.status(404).json({
                message:
                    "Project not found",
            });
        }

        // ==================================================
        // DELETE
        // ==================================================

        await prisma.websiteProject.delete({
            where: {
                id: projectId,
            },
        });

        return res.json({
            message:
                "Project deleted successfully",
        });

    } catch (error: any) {

        console.error(
            "❌ DELETE PROJECT ERROR:",
            error
        );

        return res.status(500).json({
            message:
                error?.message ||
                "Failed to delete project",
        });
    }
};

// ======================================================
// GET PROJECT PREVIEW
// ======================================================

export const getProjectPreview = async (
    req: Request,
    res: Response
) => {

    try {

        const userId =
            req.userId;

        if (!userId) {
            return res.status(401).json({
                message:
                    "Unauthorized",
            });
        }

        const projectId =
            req.params.projectId as string;

        const project =
            await prisma.websiteProject.findFirst({
                where: {
                    id: projectId,
                    userId,
                },

                include: {
                    versions: {
                        orderBy: {
                            timestamp: "asc",
                        },
                    },
                },
            });

        if (!project) {
            return res.status(404).json({
                message:
                    "Project not found",
            });
        }

        if (!project.current_code) {
            return res.status(404).json({
                message:
                    "Project code not available",
            });
        }

        return res.json({
            project,
        });

    } catch (error: any) {

        console.error(
            "❌ PREVIEW ERROR:",
            error
        );

        return res.status(500).json({
            message:
                error?.message ||
                "Failed to load preview",
        });
    }
};

// ======================================================
// GET ALL PUBLISHED PROJECTS
// ======================================================

export const getPublishedProject = async (
    req: Request,
    res: Response
) => {

    try {

        const projects =
            await prisma.websiteProject.findMany({
                where: {
                    isPublished: true,

                    current_code: {
                        not: null,
                    },
                },

                include: {
                    user: true,
                },

                orderBy: {
                    updatedAt: "desc",
                },
            });

        return res.json({
            projects,
        });

    } catch (error: any) {

        console.error(
            "❌ GET PUBLISHED PROJECTS ERROR:",
            error
        );

        return res.status(500).json({
            message:
                error?.message ||
                "Failed to get published projects",
        });
    }
};

// ======================================================
// GET SINGLE PUBLISHED PROJECT
// ======================================================

export const getProjectById = async (
    req: Request,
    res: Response
) => {

    try {

        const projectId =
            req.params.projectId as string;

        const project =
            await prisma.websiteProject.findFirst({
                where: {
                    id: projectId,

                    isPublished: true,

                    current_code: {
                        not: null,
                    },
                },
            });

        if (
            !project ||
            !project.current_code
        ) {
            return res.status(404).json({
                message:
                    "Project not found",
            });
        }

        return res.json({
            code:
                project.current_code,
        });

    } catch (error: any) {

        console.error(
            "❌ GET PUBLISHED PROJECT ERROR:",
            error
        );

        return res.status(500).json({
            message:
                error?.message ||
                "Failed to get published project",
        });
    }
};

// ======================================================
// SAVE PROJECT CODE
// ======================================================

export const saveProjectCode = async (
    req: Request,
    res: Response
) => {

    try {

        const userId =
            req.userId;

        const projectId =
            req.params.projectId as string;

        const { code } =
            req.body;

        // ==================================================
        // AUTH
        // ==================================================

        if (!userId) {
            return res.status(401).json({
                message:
                    "Unauthorized",
            });
        }

        // ==================================================
        // VALIDATE CODE
        // ==================================================

        if (
            !code ||
            typeof code !== "string"
        ) {
            return res.status(400).json({
                message:
                    "Code is required",
            });
        }

        // ==================================================
        // GET PROJECT
        // ==================================================

        const project =
            await prisma.websiteProject.findFirst({
                where: {
                    id: projectId,
                    userId,
                },
            });

        if (!project) {
            return res.status(404).json({
                message:
                    "Project not found",
            });
        }

        // ==================================================
        // CLEAN CODE
        // ==================================================

        const cleanCode =
            cleanAIHtml(code);

        if (!isValidHTML(cleanCode)) {
            return res.status(400).json({
                message:
                    "Invalid HTML code",
            });
        }

        // ==================================================
        // CREATE VERSION
        // ==================================================

        const version =
            await prisma.version.create({
                data: {
                    code:
                        cleanCode,

                    description:
                        "Manual save",

                    projectId,
                },
            });

        // ==================================================
        // UPDATE PROJECT
        // ==================================================

        await prisma.websiteProject.update({
            where: {
                id: projectId,
            },

            data: {
                current_code:
                    cleanCode,

                current_version_index:
                    version.id,
            },
        });

        console.log(
            "💾 PROJECT SAVED"
        );

        console.log(
            "📦 VERSION:",
            version.id
        );

        return res.json({
            message:
                "Project saved successfully",

            versionId:
                version.id,

            projectId,
        });

    } catch (error: any) {

        console.error(
            "❌ SAVE PROJECT ERROR:",
            error
        );

        return res.status(500).json({
            message:
                error?.message ||
                "Failed to save project",
        });
    }
};