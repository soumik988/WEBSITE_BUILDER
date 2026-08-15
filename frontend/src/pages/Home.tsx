
/*import React, { useState } from 'react'
import { Loader2Icon } from "lucide-react"
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import api from '@/configs/axios';
import { useNavigate } from 'react-router-dom';


const Home = () => {
  const { data: session } = authClient.useSession()

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate()

  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      toast.error("Please sign in to create a project");
      return;
    }

    if (!input.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      setLoading(true);

      console.log("🚀 Creating project...");

      const response = await api.post("/user/project", {
        initial_prompt: input.trim(),
      });

      console.log("✅ CREATE PROJECT RESPONSE:", response.data);

      const projectId = response.data?.projectId;

      if (!projectId) {
        throw new Error("Project ID not received from server");
      }

      console.log("🆔 Project ID:", projectId);

      // Clear input if you want
      setInput("");

      // Stop loading before navigation
      setLoading(false);

      console.log(
        "🚀 Navigating to:",
        `/projects/${projectId}`
      );

      navigate(`/projects/${projectId}`);

    } catch (error: any) {
      console.error("❌ CREATE PROJECT ERROR:", error);
      console.error("❌ SERVER RESPONSE:", error?.response?.data);

      setLoading(false);

      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create project"
      );
    }
  };

  return (
    <section className="flex flex-col items-center text-white text-sm pb-20 px-4 font-poppins">

      <a href="https://prebuiltui.com" className="flex items-center gap-2 border border-slate-700 rounded-full p-1 pr-3 text-sm mt-20">
        <span className="bg-indigo-600 text-xs px-3 py-1 rounded-full">NEW</span>
        <p className="flex items-center gap-2">
          <span>Try 30 days free trial option</span>
          <svg className="mt-px" width="6" height="9" viewBox="0 0 6 9" fill="none">
            <path d="m1 1 4 3.5L1 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </p>
      </a>

      <h1 className="text-center text-[40px] leading-12 md:text-6xl md:leading-17.5 mt-4 font-semibold max-w-3xl">
        Turn thoughts into websites instantly, with AI.
      </h1>

      <p className="text-center text-base max-w-md mt-2">
        Create, customize and publish faster than ever with our AI Site Builder.
      </p>

      <form onSubmit={onSubmitHandler} className="bg-white/10 max-w-2xl w-full rounded-xl p-4 mt-10 border border-indigo-600/70 focus-within:ring-2 ring-indigo-500 transition-all">
        <textarea
          onChange={e => setInput(e.target.value)}
          className="bg-transparent outline-none text-gray-300 resize-none w-full"
          rows={4}
          placeholder="Describe your presentation in details"
          required
        />
        <button className="ml-auto flex items-center gap-2 bg-linear-to-r from-[#CB52D4] to-indigo-600 rounded-md px-4 py-2">
          {!loading ? 'Create with AI' : (
            <>
              Creating
              <Loader2Icon className='animate-spin size-4 text-white' />
            </>
          )}
        </button>
      </form>



    </section>
  );
};

export default Home;*/
import React, { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import api from "@/configs/axios";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { data: session } = authClient.useSession();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const onSubmitHandler = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    // ================================
    // LOGIN CHECK
    // ================================

    if (!session?.user) {
      toast.error(
        "Please sign in to create a project"
      );
      return;
    }

    // ================================
    // INPUT CHECK
    // ================================

    const prompt = input.trim();

    if (!prompt) {
      toast.error(
        "Please enter a message"
      );
      return;
    }

    // ================================
    // CREATE PROJECT
    // ================================

    try {
      setLoading(true);

      console.log(
        "================================"
      );

      console.log(
        "🚀 CREATING PROJECT..."
      );

      console.log(
        "📝 PROMPT:",
        prompt
      );

      // Backend should return projectId
      // immediately after creating project.
      const { data } =
        await api.post(
          "/user/project",
          {
            initial_prompt: prompt,
          }
        );

      console.log(
        "✅ CREATE PROJECT RESPONSE:",
        data
      );

      // ================================
      // PROJECT ID CHECK
      // ================================

      const projectId =
        data?.projectId;

      if (!projectId) {
        console.error(
          "❌ PROJECT ID NOT RECEIVED"
        );

        throw new Error(
          "Project ID not received from server"
        );
      }

      console.log(
        "🆔 PROJECT ID:",
        projectId
      );

      // ================================
      // NAVIGATE IMMEDIATELY
      // ================================

      console.log(
        "🚀 NAVIGATING TO PROJECT..."
      );

      console.log(
        `/projects/${projectId}`
      );

      setInput("");

      setLoading(false);

      navigate(
        `/projects/${projectId}`
      );

    } catch (error: any) {

      console.error(
        "❌ CREATE PROJECT ERROR:",
        error
      );

      console.error(
        "❌ SERVER RESPONSE:",
        error?.response?.data
      );

      setLoading(false);

      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create project"
      );
    }
  };

  return (
    <section
      className="
        flex
        flex-col
        items-center
        text-white
        text-sm
        pb-20
        px-4
        font-poppins
      "
    >

      {/* ================================
          TOP BADGE
      ================================= */}

      <a
        href="https://prebuiltui.com"
        className="
          flex
          items-center
          gap-2
          border
          border-slate-700
          rounded-full
          p-1
          pr-3
          text-sm
          mt-20
        "
      >

        <span
          className="
            bg-indigo-600
            text-xs
            px-3
            py-1
            rounded-full
          "
        >
          NEW
        </span>

        <p className="flex items-center gap-2">

          <span>
            Try 30 days free trial option
          </span>

          <svg
            className="mt-px"
            width="6"
            height="9"
            viewBox="0 0 6 9"
            fill="none"
          >
            <path
              d="m1 1 4 3.5L1 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

        </p>

      </a>


      {/* ================================
          HEADING
      ================================= */}

      <h1
        className="
          text-center
          text-[40px]
          leading-12
          md:text-6xl
          md:leading-17.5
          mt-4
          font-semibold
          max-w-3xl
        "
      >
        Turn thoughts into websites instantly,
        with AI.
      </h1>


      {/* ================================
          DESCRIPTION
      ================================= */}

      <p
        className="
          text-center
          text-base
          max-w-md
          mt-2
          text-gray-300
        "
      >
        Create, customize and publish faster
        than ever with our AI Site Builder.
      </p>


      {/* ================================
          CREATE FORM
      ================================= */}

      <form
        onSubmit={onSubmitHandler}
        className="
          bg-white/10
          max-w-2xl
          w-full
          rounded-xl
          p-4
          mt-10
          border
          border-indigo-600/70
          focus-within:ring-2
          ring-indigo-500
          transition-all
        "
      >

        {/* TEXTAREA */}

        <textarea
          value={input}
          onChange={(e) =>
            setInput(e.target.value)
          }
          className="
            bg-transparent
            outline-none
            text-gray-300
            resize-none
            w-full
            placeholder:text-gray-500
          "
          rows={4}
          placeholder="Describe your website in detail..."
          disabled={loading}
          required
        />


        {/* BUTTON */}

        <button
          type="submit"
          disabled={loading}
          className="
            ml-auto
            flex
            items-center
            gap-2
            bg-linear-to-r
            from-[#CB52D4]
            to-indigo-600
            hover:from-[#b947c0]
            hover:to-indigo-500
            rounded-md
            px-4
            py-2
            transition-all
            disabled:opacity-60
            disabled:cursor-not-allowed
          "
        >

          {loading ? (
            <>
              Creating

              <Loader2Icon
                className="
                  animate-spin
                  size-4
                  text-white
                "
              />
            </>
          ) : (
            "Create with AI"
          )}

        </button>

      </form>

    </section>
  );
};

export default Home;