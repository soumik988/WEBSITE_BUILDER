
import { Request, Response } from "express";
import prisma from "../liib/prisma.js";
import openai from "../configs/openai.js";


// ======================================================
// AI HELPER WITH RETRY
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
                error?.code ||
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

            console.log(
                `⏳ Rate limited. Retrying after ${retryAfter}s...`
            );

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
// CLEAN AI HTML
// ======================================================

const cleanAIHtml = (
    rawCode: string
): string => {

    if (!rawCode) {
        return "";
    }


    let html = rawCode.trim();


    // --------------------------------------------------
    // Remove markdown code fences
    // --------------------------------------------------

    html = html
        .replace(/^```html\s*/i, "")
        .replace(/^```HTML\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();


    // --------------------------------------------------
    // Find <html>
    // --------------------------------------------------

    const htmlStart =
        html.search(/<html[\s>]/i);


    if (htmlStart === -1) {

        return html;

    }


    // Remove everything before <html>
    html =
        html.substring(htmlStart).trim();


    // --------------------------------------------------
    // Find closing </html>
    // --------------------------------------------------

    const htmlEnd =
        html.search(/<\/html>/i);


    if (htmlEnd !== -1) {

        // Remove anything after </html>
        html =
            html
                .substring(
                    0,
                    htmlEnd + "</html>".length
                )
                .trim();

    }


    // --------------------------------------------------
    // Make sure body exists
    // --------------------------------------------------

    const hasBody =
        /<body[\s>]/i.test(html);


    if (
        hasBody &&
        !/<\/body>/i.test(html)
    ) {

        console.log(
            "⚠️ Missing </body> - repairing"
        );

        html += "\n</body>";

    }


    // --------------------------------------------------
    // Make sure html closing tag exists
    // --------------------------------------------------

    if (
        /<html[\s>]/i.test(html) &&
        !/<\/html>/i.test(html)
    ) {

        console.log(
            "⚠️ Missing </html> - repairing"
        );

        html += "\n</html>";

    }


    return html.trim();
};


// ======================================================
// VALIDATE AI HTML
// ======================================================

const isValidHTML = (
    html: string
): boolean => {

    if (!html) {
        return false;
    }


    const hasHtml =
        /<html[\s>]/i.test(html);

    const hasHead =
        /<head[\s>]/i.test(html);

    const hasBody =
        /<body[\s>]/i.test(html);

    const hasHtmlEnd =
        /<\/html>/i.test(html);

    const hasBodyEnd =
        /<\/body>/i.test(html);


    return (
        hasHtml &&
        hasHead &&
        hasBody &&
        hasBodyEnd &&
        hasHtmlEnd
    );
};


// ======================================================
// GET USER CREDITS
// ======================================================

export const getUserCredits = async (
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


        const user =
            await prisma.user.findUnique({
                where: {
                    id: userId,
                },
            });


        return res.json({
            credits: user?.credits ?? 0,
        });


    } catch (error: any) {

        console.error(
            "❌ GET CREDITS ERROR:",
            error
        );


        return res.status(500).json({
            message:
                error?.message ||
                "Failed to get credits",
        });

    }
};


// ======================================================
// BACKGROUND WEBSITE GENERATION
// ======================================================

const generateWebsite = async (
    projectId: string,
    userId: string,
    initialPrompt: string
) => {

    try {

        console.log(
            "\n========================================"
        );

        console.log(
            "🤖 BACKGROUND AI GENERATION START"
        );

        console.log(
            "PROJECT ID:",
            projectId
        );

        console.log(
            "========================================"
        );


        // ==================================================
        // STEP 1 - PROMPT ENHANCEMENT
        // ==================================================

        console.log(
            "🤖 STEP 1: STARTING PROMPT ENHANCEMENT"
        );


        const promptEnhanceResponse =
            await callAIWithRetry(

                {
                    model:
                        "openai/gpt-oss-20b:free",

                    messages: [

                        {
                            role: "system",

                            content: `
You are a professional website prompt enhancement specialist.

Rewrite the user's request into a clear and detailed prompt for an AI web developer.

Include:

- website purpose
- layout
- color scheme
- typography
- sections
- components
- features
- interactions
- responsive behavior
- modern UI/UX
- accessibility where useful

Keep the user's original intent.

Do not invent unrelated features.

Return ONLY the enhanced prompt.

Do not use markdown.
Do not explain anything.
Keep it concise.
`,
                        },

                        {
                            role: "user",

                            content:
                                initialPrompt,
                        },

                    ],

                    temperature: 0.2,

                    max_tokens: 700,
                },

                {
                    timeout: 60000,
                },

                2
            );


        const enhancedPrompt =
            promptEnhanceResponse
                ?.choices?.[0]
                ?.message
                ?.content
                ?.trim() || "";


        console.log(
            "📝 ENHANCED PROMPT LENGTH:",
            enhancedPrompt.length
        );


        // ==================================================
        // EMPTY PROMPT
        // ==================================================

        if (!enhancedPrompt) {

            console.log(
                "❌ PROMPT ENHANCEMENT RETURNED EMPTY"
            );


            await prisma.conversation.create({

                data: {

                    role: "assistant",

                    content:
                        "Unable to enhance the prompt. Please try again.",

                    projectId,

                },

            });


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


            return;
        }


        console.log(
            "✅ ENHANCED PROMPT GENERATED"
        );


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


        // ==================================================
        // GENERATING MESSAGE
        // ==================================================

        await prisma.conversation.create({

            data: {

                role: "assistant",

                content:
                    "Now generating your website...",

                projectId,

            },

        });


        // ==================================================
        // STEP 2 - WEBSITE GENERATION
        // ==================================================

        console.log(
            "\n🚀 STEP 2: STARTING WEBSITE GENERATION"
        );


        const codeGenerationResponse =
            await callAIWithRetry(

                {

                    model: "nvidia/nemotron-3-ultra-550b-a55b:free",

                    messages: [

                        {

                            role: "system",

                            content: `
You are an expert frontend web developer.

Create a complete, beautiful, production-quality single-page website.

==================================================
OUTPUT REQUIREMENTS
==================================================

Return ONLY a complete HTML document.

The response MUST start with:

<html

The response MUST end with:

</html>

The document MUST contain:

<html>
<head>
</head>
<body>
</body>
</html>

Do NOT return markdown.

Do NOT use code fences.

Do NOT provide explanations.

Do NOT provide JSON.

Do NOT provide analysis.

==================================================
STYLING
==================================================

- Use Tailwind CSS.
- Include this exact script inside <head>:

<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>

- Use responsive Tailwind classes.
- Use modern typography.
- Use beautiful spacing.
- Use responsive layouts.
- Use transitions and animations where useful.
- Make the website visually polished.

==================================================
JAVASCRIPT
==================================================

Put JavaScript inside <script> before </body>.

Make sure JavaScript is valid.

NEVER use a variable before initialization.

For example, NEVER do:

updateThemeIcons();

const sunIcon = ...;

Instead:

const sunIcon = ...;

function updateThemeIcons() {
    // use sunIcon here
}

updateThemeIcons();

If you create theme functionality:

1. initialize DOM elements first
2. define functions
3. attach events
4. call functions

Never create ReferenceError, TypeError or SyntaxError.

==================================================
COLOR INPUT
==================================================

If using:

<input type="color">

its value MUST be hexadecimal.

Correct:

value="#ffffff"

Never use:

value="rgb(...)"

value="oklch(...)"

value="var(...)"

==================================================
WEBSITE
==================================================

Build the website based on the following request:

${enhancedPrompt}

==================================================
FINAL CHECK
==================================================

Before responding:

- Complete <html>
- Complete <head>
- Complete <body>
- Valid JavaScript
- No variables before initialization
- No markdown
- No explanations
- No code fences

Return ONLY HTML.
`,
                        },

                        {

                            role: "user",

                            content:
                                enhancedPrompt,

                        },

                    ],

                    temperature: 0.15,

                    max_tokens: 24000,

                },

                {

                    timeout: 180000,

                },

                2

            );




        // ==================================================
        // GET CODE
        // ==================================================

        const rawCode =
            codeGenerationResponse
                ?.choices?.[0]
                ?.message
                ?.content
                ?.trim() || "";


        console.log(
            "📝 GENERATED CODE LENGTH:",
            rawCode.length
        );


        // ==================================================
        // EMPTY CODE
        // ==================================================

        if (!rawCode) {

            console.log(
                "❌ NO CODE RETURNED"
            );


            await prisma.conversation.create({

                data: {

                    role: "assistant",

                    content:
                        "Unable to generate the code, please try again.",

                    projectId,

                },

            });


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


            return;
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
        // VALIDATE
        // ==================================================

        if (!isValidHTML(cleanCode)) {

            console.log(
                "❌ INITIAL AI HTML INVALID"
            );


            console.log(
                "OUTPUT START:"
            );

            console.log(
                cleanCode.substring(
                    0,
                    1000
                )
            );


            console.log(
                "OUTPUT END:"
            );

            console.log(
                cleanCode.substring(
                    Math.max(
                        0,
                        cleanCode.length - 2000
                    )
                )
            );


            await prisma.conversation.create({

                data: {

                    role: "assistant",

                    content:
                        "Unable to generate valid website code. Please try again.",

                    projectId,

                },

            });


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


            return;
        }


        console.log(
            "✅ GENERATED HTML VALID"
        );


        // ==================================================
        // CREATE VERSION
        // ==================================================

        const version =
            await prisma.version.create({

                data: {

                    code:
                        cleanCode,

                    description:
                        "initial version",

                    projectId,

                },

            });


        console.log(
            "✅ VERSION CREATED:",
            version.id
        );


        // ==================================================
        // SAVE SUCCESS MESSAGE
        // ==================================================

        await prisma.conversation.create({

            data: {

                role: "assistant",

                content:
                    "I have created your Website! You can now preview it and request any changes.",

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
            "🎉 BACKGROUND WEBSITE GENERATION SUCCESS"
        );


    } catch (error: any) {

        console.error(
            "\n========================================"
        );

        console.error(
            "🔥 BACKGROUND GENERATION ERROR"
        );

        console.error(
            "MESSAGE:",
            error?.message
        );

        console.error(
            "FULL ERROR:",
            error
        );

        console.error(
            "========================================"
        );


        try {

            await prisma.conversation.create({

                data: {

                    role: "assistant",

                    content:
                        "Something went wrong while generating your website. Please try again.",

                    projectId,

                },

            });

        } catch (conversationError) {

            console.error(
                "❌ FAILED TO SAVE ERROR MESSAGE:",
                conversationError
            );

        }


        // Return credits
        try {

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
                "💳 5 CREDITS RETURNED"
            );

        } catch (creditError) {

            console.error(
                "❌ FAILED TO RETURN CREDITS:",
                creditError
            );

        }

    }

};


// ======================================================
// CREATE USER PROJECT
// ======================================================

export const createUserProject = async (
    req: Request,
    res: Response
) => {

    const userId =
        req.userId;


    try {

        console.log(
            "\n========================================"
        );

        console.log(
            "🚀 CREATE PROJECT START"
        );

        console.log(
            "========================================"
        );


        const {
            initial_prompt,
        } = req.body;


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
        // VALIDATE PROMPT
        // ==================================================

        if (
            !initial_prompt ||
            typeof initial_prompt !== "string" ||
            !initial_prompt.trim()
        ) {

            return res.status(400).json({

                message:
                    "Initial prompt is required",

            });

        }


        // ==================================================
        // USER
        // ==================================================

        const user =
            await prisma.user.findUnique({

                where: {

                    id: userId,

                },

            });


        if (!user) {

            return res.status(404).json({

                message:
                    "User not found",

            });

        }


        // ==================================================
        // CREDIT CHECK
        // ==================================================

        if (user.credits < 5) {

            return res.status(403).json({

                message:
                    "Add credits to create more projects",

            });

        }


        // ==================================================
        // CREATE PROJECT
        // ==================================================

        const project =
            await prisma.websiteProject.create({

                data: {

                    name:
                        initial_prompt.length > 50
                            ? initial_prompt.substring(
                                0,
                                47
                            ) + "..."
                            : initial_prompt,

                    initial_prompt:
                        initial_prompt.trim(),

                    userId,

                },

            });


        console.log(
            "✅ PROJECT CREATED:",
            project.id
        );


        // ==================================================
        // TOTAL CREATION
        // ==================================================

        await prisma.user.update({

            where: {

                id: userId,

            },

            data: {

                totalCreation: {

                    increment: 1,

                },

            },

        });


        // ==================================================
        // SAVE USER MESSAGE
        // ==================================================

        await prisma.conversation.create({

            data: {

                role: "user",

                content:
                    initial_prompt.trim(),

                projectId:
                    project.id,

            },

        });


        // ==================================================
        // DEDUCT CREDITS
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


        console.log(
            "💳 5 CREDITS DEDUCTED"
        );


        // ==================================================
        // RETURN PROJECT ID IMMEDIATELY
        // ==================================================

        res.status(200).json({

            projectId:
                project.id,

        });


        console.log(
            "🚀 PROJECT ID SENT TO FRONTEND"
        );


        // ==================================================
        // BACKGROUND AI
        // ==================================================

        generateWebsite(

            project.id,

            userId,

            initial_prompt.trim()

        ).catch((error) => {

            console.error(
                "🔥 UNHANDLED BACKGROUND ERROR:",
                error
            );

        });


    } catch (error: any) {

        console.error(
            "\n========================================"
        );

        console.error(
            "🔥 CREATE PROJECT ERROR"
        );

        console.error(
            "MESSAGE:",
            error?.message
        );

        console.error(
            "FULL ERROR:",
            error
        );

        console.error(
            "========================================"
        );


        return res.status(500).json({

            message:
                error?.message ||
                "Failed to create project",

        });

    }

};


// ======================================================
// GET SINGLE USER PROJECT
// ======================================================

export const getUserProject = async (
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
            await prisma.websiteProject.findUnique({

                where: {

                    id:
                        projectId,

                    userId,

                },

                include: {

                    conversation: {

                        orderBy: {

                            timestamp:
                                "asc",

                        },

                    },

                    versions: {

                        orderBy: {

                            timestamp:
                                "asc",

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


        return res.json({

            project,

        });


    } catch (error: any) {

        console.error(
            "❌ GET PROJECT ERROR:",
            error
        );


        return res.status(500).json({

            message:
                error?.message ||
                "Failed to get project",

        });

    }

};


// ======================================================
// GET ALL USER PROJECTS
// ======================================================

export const getUserProjects = async (
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


        const projects =
            await prisma.websiteProject.findMany({

                where: {

                    userId,

                },

                orderBy: {

                    updatedAt:
                        "desc",

                },

            });


        return res.json({

            projects,

        });


    } catch (error: any) {

        console.error(
            "❌ GET PROJECTS ERROR:",
            error
        );


        return res.status(500).json({

            message:
                error?.message ||
                "Failed to get projects",

        });

    }

};


// ======================================================
// GENERATE PROJECT REVISION
// ======================================================

export const generateProjectRevision = async (
    req: Request,
    res: Response
) => {

    const userId =
        req.userId;

    const projectId =
        req.params.projectId as string;

    const {
        prompt,
    } = req.body;


    try {

        console.log(
            "\n========================================"
        );

        console.log(
            "🔄 PROJECT REVISION START"
        );

        console.log(
            "PROJECT ID:",
            projectId
        );

        console.log(
            "REVISION:",
            prompt
        );

        console.log(
            "========================================"
        );


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
        // PROMPT VALIDATION
        // ==================================================

        if (
            !prompt ||
            typeof prompt !== "string" ||
            !prompt.trim()
        ) {

            return res.status(400).json({

                message:
                    "Revision prompt is required",

            });

        }


        // ==================================================
        // GET PROJECT
        // ==================================================

        const project =
            await prisma.websiteProject.findUnique({

                where: {

                    id:
                        projectId,

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
        // CHECK CODE
        // ==================================================

        if (!project.current_code) {

            return res.status(400).json({

                message:
                    "Website is not ready yet. Please wait for generation to finish.",

            });

        }


        // ==================================================
        // SAVE USER REVISION
        // ==================================================

        await prisma.conversation.create({

            data: {

                role:
                    "user",

                content:
                    prompt.trim(),

                projectId,

            },

        });


        console.log(
            "✅ REVISION REQUEST SAVED"
        );


        // ==================================================
        // START REVISION AI
        // ==================================================

        console.log(
            "🤖 STARTING REVISION AI..."
        );


        const revisionResponse =
            await callAIWithRetry(

                {

                  model: "google/gemma-4-31b-it:free",

                    messages: [

                        // ==================================================
                        // SYSTEM
                        // ==================================================

                        {

                            role:
                                "system",

                            content: `
You are an expert website editor.

You are modifying an EXISTING website.

The existing HTML will be provided.

The user will provide ONE requested change.

Your job is to modify the existing website.

==================================================
MOST IMPORTANT RULE
==================================================

DO NOT recreate the website.

DO NOT redesign the website.

DO NOT rewrite unrelated parts.

Make ONLY the requested change.

Preserve everything else exactly.

==================================================
EXAMPLE
==================================================

User request:

change navbar color to red

Correct behavior:

- find the existing navbar
- change its background/color to red
- keep the navbar content
- keep logo
- keep links
- keep buttons
- keep theme system
- keep JavaScript
- keep animations
- keep responsive behavior
- keep every unrelated section unchanged

==================================================
JAVASCRIPT SAFETY
==================================================

DO NOT modify existing JavaScript unless the user explicitly asks for a JavaScript/functionality change.

NEVER introduce:

ReferenceError
TypeError
SyntaxError

NEVER use variables before initialization.

For example, this is WRONG:

updateThemeIcons();

const sunIcon =
    document.getElementById("sunIcon");

This is CORRECT:

const sunIcon =
    document.getElementById("sunIcon");

function updateThemeIcons() {
    // use sunIcon here
}

updateThemeIcons();

If the existing website has:

sunIcon
moonIcon
updateThemeIcons
dark mode
light mode
theme toggle

DO NOT modify them for a simple CSS request.

==================================================
COLOR INPUT SAFETY
==================================================

For:

<input type="color">

ONLY use hexadecimal values.

Correct:

value="#ffffff"

Never use:

value="rgb(...)"

value="rgba(...)"

value="hsl(...)"

value="hsla(...)"

value="oklch(...)"

value="var(...)"

==================================================
HTML SAFETY
==================================================

Return a COMPLETE HTML document.

Required:

<html>
<head>
</head>
<body>
</body>
</html>

The response MUST start with <html.

The response MUST end with </html>.

==================================================
OUTPUT
==================================================

Return ONLY HTML.

NO markdown.

NO code fences.

NO explanation.

NO JSON.

NO reasoning.

NO text before <html>.

==================================================
FINAL CHECK
==================================================

Before returning:

1. Preserve the existing website.
2. Apply only the user's requested change.
3. Preserve unrelated HTML.
4. Preserve existing JavaScript.
5. Do not introduce ReferenceError.
6. Do not use variables before initialization.
7. Make sure <html> exists.
8. Make sure <head> exists.
9. Make sure <body> exists.
10. Make sure </body> exists.
11. Make sure </html> exists.
12. Make sure the final output is complete HTML.

==================================================
USER REQUEST
==================================================

${prompt.trim()}

==================================================
EXISTING WEBSITE
==================================================

${project.current_code}

==================================================
FINAL RESPONSE
==================================================

Return ONLY the modified complete HTML.
`,

                        },


                        // ==================================================
                        // USER
                        // ==================================================

                        {

                            role:
                                "user",

                            content: `
Modify the existing website.

User request:

${prompt.trim()}

Existing website:

${project.current_code}

Return ONLY the complete updated HTML.
`,

                        },

                    ],

                    temperature:
                        0.1,

                    max_tokens:
                        24000,

                },

                {

                    timeout:
                        180000,

                },

                2

            );


        console.log(
            "✅ REVISION AI FINISHED"
        );


        // ==================================================
        // RAW RESPONSE
        // ==================================================

        const rawContent =
            revisionResponse
                ?.choices?.[0]
                ?.message
                ?.content;


        console.log(
            "🤖 REVISION AI RESPONSE RECEIVED"
        );


        console.log(
            "📝 RAW CONTENT TYPE:",
            typeof rawContent
        );


        console.log(
            "📝 RAW CONTENT LENGTH:",
            typeof rawContent === "string"
                ? rawContent.length
                : 0
        );


        // ==================================================
        // EMPTY RESPONSE
        // ==================================================

        if (
            typeof rawContent !== "string" ||
            !rawContent.trim()
        ) {

            console.log(
                "❌ REVISION AI RETURNED EMPTY"
            );


            await prisma.conversation.create({

                data: {

                    role:
                        "assistant",

                    content:
                        "Unable to update the website. Please try again.",

                    projectId,

                },

            });


            return res.status(500).json({

                message:
                    "AI did not return updated website code",

            });

        }


        // ==================================================
        // CLEAN HTML
        // ==================================================

        let cleanCode =
            cleanAIHtml(
                rawContent
            );


        console.log(
            "🧹 CLEAN CODE LENGTH:",
            cleanCode.length
        );


        // ==================================================
        // VALIDATE HTML
        // ==================================================

        if (!isValidHTML(cleanCode)) {

            console.log(
                "❌ AI RETURNED INVALID HTML"
            );


            console.log(
                "❌ OUTPUT START:"
            );

            console.log(
                cleanCode.substring(
                    0,
                    1500
                )
            );


            console.log(
                "❌ OUTPUT END:"
            );

            console.log(
                cleanCode.substring(
                    Math.max(
                        0,
                        cleanCode.length - 2500
                    )
                )
            );


            await prisma.conversation.create({

                data: {

                    role:
                        "assistant",

                    content:
                        "Unable to update the website because the AI returned incomplete HTML. Please try again.",

                    projectId,

                },

            });


            return res.status(500).json({

                message:
                    "AI returned invalid or incomplete HTML",

            });

        }


        console.log(
            "✅ VALID HTML RECEIVED"
        );


        // ==================================================
        // CREATE VERSION
        // ==================================================

        console.log(
            "📦 CREATING NEW VERSION..."
        );


        const version =
            await prisma.version.create({

                data: {

                    code:
                        cleanCode,

                    description:
                        prompt.trim(),

                    projectId,

                },

            });


        console.log(
            "✅ NEW VERSION CREATED:",
            version.id
        );


        // ==================================================
        // UPDATE PROJECT
        // ==================================================

        await prisma.websiteProject.update({

            where: {

                id:
                    projectId,

            },

            data: {

                current_code:
                    cleanCode,

                current_version_index:
                    version.id,

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

                role:
                    "assistant",

                content:
                    "I have updated your website successfully. You can preview the updated version now.",

                projectId,

            },

        });


        console.log(
            "✅ SUCCESS MESSAGE SAVED"
        );


        // ==================================================
        // GET UPDATED PROJECT
        // ==================================================

        const updatedProject =
            await prisma.websiteProject.findUnique({

                where: {

                    id:
                        projectId,

                    userId,

                },

                include: {

                    conversation: {

                        orderBy: {

                            timestamp:
                                "asc",

                        },

                    },

                    versions: {

                        orderBy: {

                            timestamp:
                                "asc",

                        },

                    },

                },

            });


        // ==================================================
        // SUCCESS
        // ==================================================

        console.log(
            "\n========================================"
        );

        console.log(
            "🎉 PROJECT REVISION SUCCESS"
        );

        console.log(
            "PROJECT ID:",
            projectId
        );

        console.log(
            "UPDATED VERSION:",
            version.id
        );

        console.log(
            "========================================\n"
        );


        return res.status(200).json({

            message:
                "Website updated successfully",

            project:
                updatedProject,

        });


    } catch (error: any) {

        console.error(
            "\n========================================"
        );

        console.error(
            "🔥 PROJECT REVISION ERROR"
        );

        console.error(
            "MESSAGE:",
            error?.message
        );

        console.error(
            "FULL ERROR:",
            error
        );

        console.error(
            "========================================"
        );


        try {

            await prisma.conversation.create({

                data: {

                    role:
                        "assistant",

                    content:
                        "Something went wrong while updating the website. Please try again.",

                    projectId,

                },

            });

        } catch (conversationError) {

            console.error(
                "❌ FAILED TO SAVE REVISION ERROR:",
                conversationError
            );

        }


        return res.status(500).json({

            message:
                error?.message ||
                "Failed to update website",

        });

    }

};
// ======================================================
// ROLLBACK PROJECT VERSION
// ======================================================

export const rollbackProjectVersion = async (
    req: Request,
    res: Response
) => {

    try {

        const userId = req.userId;

        const projectId =
            req.params.projectId as string;

        const versionId =
            req.params.versionId as string;


        // ==================================================
        // AUTH
        // ==================================================

        if (!userId) {

            return res.status(401).json({
                message: "Unauthorized",
            });

        }


        console.log(
            "\n========================================"
        );

        console.log(
            "🔄 PROJECT ROLLBACK START"
        );

        console.log(
            "PROJECT ID:",
            projectId
        );

        console.log(
            "VERSION ID:",
            versionId
        );

        console.log(
            "========================================"
        );


        // ==================================================
        // GET PROJECT
        // ==================================================

        const project =
            await prisma.websiteProject.findUnique({
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


        // ==================================================
        // GET VERSION
        // ==================================================

        const version =
            await prisma.version.findFirst({
                where: {
                    id: versionId,
                    projectId,
                },
            });


        if (!version) {

            return res.status(404).json({
                message: "Version not found",
            });

        }


        // ==================================================
        // CHECK CODE
        // ==================================================

        if (!version.code) {

            return res.status(400).json({
                message: "This version does not contain website code",
            });

        }


        // ==================================================
        // CHECK ALREADY CURRENT
        // ==================================================

        if (
            project.current_version_index ===
            version.id
        ) {

            return res.status(400).json({
                message: "This version is already the current version",
            });

        }


        // ==================================================
        // UPDATE PROJECT
        // ==================================================

        const updatedProject =
            await prisma.websiteProject.update({

                where: {
                    id: projectId,
                },

                data: {

                    current_code:
                        version.code,

                    current_version_index:
                        version.id,

                },

            });


        console.log(
            "✅ PROJECT ROLLED BACK"
        );

        console.log(
            "CURRENT VERSION:",
            version.id
        );

        console.log(
            "CODE LENGTH:",
            version.code.length
        );


        // ==================================================
        // SAVE CONVERSATION MESSAGE
        // ==================================================

        await prisma.conversation.create({

            data: {

                role: "assistant",

                content:
                    `Website rolled back to version: ${version.description || version.id}`,

                projectId,

            },

        });


        // ==================================================
        // GET COMPLETE PROJECT
        // ==================================================

        const completeProject =
            await prisma.websiteProject.findUnique({

                where: {

                    id: projectId,

                    userId,

                },

                include: {

                    conversation: {

                        orderBy: {

                            timestamp: "asc",

                        },

                    },

                    versions: {

                        orderBy: {

                            timestamp: "asc",

                        },

                    },

                },

            });


        console.log(
            "🎉 PROJECT ROLLBACK SUCCESS"
        );

        console.log(
            "========================================\n"
        );


        // ==================================================
        // RESPONSE
        // ==================================================

        return res.status(200).json({

            message:
                "Website rolled back successfully",

            project:
                completeProject,

            version: {

                id:
                    version.id,

                description:
                    version.description,

            },

        });


    } catch (error: any) {

        console.error(
            "\n========================================"
        );

        console.error(
            "🔥 PROJECT ROLLBACK ERROR"
        );

        console.error(
            "MESSAGE:",
            error?.message
        );

        console.error(
            "FULL ERROR:",
            error
        );

        console.error(
            "========================================"
        );


        return res.status(500).json({

            message:
                error?.message ||
                "Failed to rollback project",

        });

    }

};

// ======================================================
// TOGGLE PROJECT PUBLISH
// ======================================================

export const togglePublish = async (
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
            await prisma.websiteProject.findUnique({

                where: {

                    id:
                        projectId,

                    userId,

                },

            });


        if (!project) {

            return res.status(404).json({

                message:
                    "Project not found",

            });

        }


        await prisma.websiteProject.update({

            where: {

                id:
                    projectId,

            },

            data: {

                isPublished:
                    !project.isPublished,

            },

        });


        return res.json({

            message:
                project.isPublished
                    ? "Project unpublished"
                    : "Project published successfully",

        });


    } catch (error: any) {

        console.error(
            "❌ TOGGLE PUBLISH ERROR:",
            error
        );


        return res.status(500).json({

            message:
                error?.message ||
                "Failed to update publish status",

        });

    }

};


// ======================================================
// PURCHASE CREDITS
// ======================================================

export const purchaseCredit = async (
    req: Request,
    res: Response
) => {

    return res.status(501).json({

        message:
            "Purchase credits is not implemented yet",

    });

};