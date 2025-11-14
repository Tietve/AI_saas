--
-- PostgreSQL database dump
--

\restrict BZQlxHfUg5Usm35cIvZ1sYITiFCh4ImiSDbgwiUSQeqyyvg6q8PCuNghGTIxVYf

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: orchestrator; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA orchestrator;


ALTER SCHEMA orchestrator OWNER TO postgres;

--
-- Name: EvalStatus; Type: TYPE; Schema: orchestrator; Owner: postgres
--

CREATE TYPE orchestrator."EvalStatus" AS ENUM (
    'PENDING',
    'RUNNING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE orchestrator."EvalStatus" OWNER TO postgres;

--
-- Name: PlanTier; Type: TYPE; Schema: orchestrator; Owner: postgres
--

CREATE TYPE orchestrator."PlanTier" AS ENUM (
    'FREE',
    'PLUS',
    'PRO',
    'ENTERPRISE'
);


ALTER TYPE orchestrator."PlanTier" OWNER TO postgres;

--
-- Name: PromptType; Type: TYPE; Schema: orchestrator; Owner: postgres
--

CREATE TYPE orchestrator."PromptType" AS ENUM (
    'SUMMARIZER',
    'UPGRADER',
    'RAG_QUERY',
    'CUSTOM'
);


ALTER TYPE orchestrator."PromptType" OWNER TO postgres;

--
-- Name: RoleType; Type: TYPE; Schema: orchestrator; Owner: postgres
--

CREATE TYPE orchestrator."RoleType" AS ENUM (
    'OWNER',
    'ADMIN',
    'MEMBER',
    'VIEWER'
);


ALTER TYPE orchestrator."RoleType" OWNER TO postgres;

--
-- Name: RolloutStage; Type: TYPE; Schema: orchestrator; Owner: postgres
--

CREATE TYPE orchestrator."RolloutStage" AS ENUM (
    'DEVELOPMENT',
    'CANARY_5',
    'CANARY_25',
    'CANARY_50',
    'PRODUCTION',
    'FULL_100'
);


ALTER TYPE orchestrator."RolloutStage" OWNER TO postgres;

--
-- Name: RunType; Type: TYPE; Schema: orchestrator; Owner: postgres
--

CREATE TYPE orchestrator."RunType" AS ENUM (
    'NIGHTLY',
    'ON_DEMAND',
    'PRE_DEPLOY',
    'CONTINUOUS'
);


ALTER TYPE orchestrator."RunType" OWNER TO postgres;

--
-- Name: EvalStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EvalStatus" AS ENUM (
    'PENDING',
    'RUNNING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE public."EvalStatus" OWNER TO postgres;

--
-- Name: PlanTier; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PlanTier" AS ENUM (
    'FREE',
    'PLUS',
    'PRO',
    'ENTERPRISE'
);


ALTER TYPE public."PlanTier" OWNER TO postgres;

--
-- Name: PromptType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PromptType" AS ENUM (
    'SUMMARIZER',
    'UPGRADER',
    'RAG_QUERY',
    'CUSTOM'
);


ALTER TYPE public."PromptType" OWNER TO postgres;

--
-- Name: RoleType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RoleType" AS ENUM (
    'OWNER',
    'ADMIN',
    'MEMBER',
    'VIEWER'
);


ALTER TYPE public."RoleType" OWNER TO postgres;

--
-- Name: RolloutStage; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RolloutStage" AS ENUM (
    'DEVELOPMENT',
    'CANARY_5',
    'CANARY_25',
    'CANARY_50',
    'PRODUCTION',
    'FULL_100'
);


ALTER TYPE public."RolloutStage" OWNER TO postgres;

--
-- Name: RunType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RunType" AS ENUM (
    'NIGHTLY',
    'ON_DEMAND',
    'PRE_DEPLOY',
    'CONTINUOUS'
);


ALTER TYPE public."RunType" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ConversationState; Type: TABLE; Schema: orchestrator; Owner: postgres
--

CREATE TABLE orchestrator."ConversationState" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "userId" text NOT NULL,
    "turnNumber" integer DEFAULT 0 NOT NULL,
    "currentRole" character varying(500),
    "currentTask" character varying(500),
    "currentDomain" character varying(200),
    "contextSummary" text DEFAULT ''::text NOT NULL,
    "usedKnowledgeIds" text[],
    "messageHistory" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "lastActivity" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE orchestrator."ConversationState" OWNER TO postgres;

--
-- Name: ConversationSummary; Type: TABLE; Schema: orchestrator; Owner: postgres
--

CREATE TABLE orchestrator."ConversationSummary" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "userId" text NOT NULL,
    summary text NOT NULL,
    "messageCount" integer NOT NULL,
    "lastMessageId" text NOT NULL,
    "embeddingModel" text DEFAULT 'text-embedding-3-small'::text NOT NULL,
    "pineconeId" text,
    "hitCount" integer DEFAULT 0 NOT NULL,
    "lastHitAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE orchestrator."ConversationSummary" OWNER TO postgres;

--
-- Name: EvalDataset; Type: TABLE; Schema: orchestrator; Owner: postgres
--

CREATE TABLE orchestrator."EvalDataset" (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(500),
    category text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE orchestrator."EvalDataset" OWNER TO postgres;

--
-- Name: EvalQuestion; Type: TABLE; Schema: orchestrator; Owner: postgres
--

CREATE TABLE orchestrator."EvalQuestion" (
    id text NOT NULL,
    "evalDatasetId" text NOT NULL,
    question text NOT NULL,
    "expectedAnswer" text,
    category text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE orchestrator."EvalQuestion" OWNER TO postgres;

--
-- Name: EvalResult; Type: TABLE; Schema: orchestrator; Owner: postgres
--

CREATE TABLE orchestrator."EvalResult" (
    id text NOT NULL,
    "evalRunId" text NOT NULL,
    "evalQuestionId" text NOT NULL,
    "actualAnswer" text,
    "upgradePrompt" text,
    "llmResponse" text,
    "relevanceScore" double precision,
    "faithfulnessScore" double precision,
    "helpfulnessScore" double precision,
    passed boolean DEFAULT false NOT NULL,
    "piiLeakDetected" boolean DEFAULT false NOT NULL,
    "injectionDetected" boolean DEFAULT false NOT NULL,
    "latencyMs" integer,
    "tokensIn" integer,
    "tokensOut" integer,
    "errorMessage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE orchestrator."EvalResult" OWNER TO postgres;

--
-- Name: EvalRun; Type: TABLE; Schema: orchestrator; Owner: postgres
--

CREATE TABLE orchestrator."EvalRun" (
    id text NOT NULL,
    "evalDatasetId" text NOT NULL,
    "runType" orchestrator."RunType" DEFAULT 'NIGHTLY'::orchestrator."RunType" NOT NULL,
    status orchestrator."EvalStatus" DEFAULT 'PENDING'::orchestrator."EvalStatus" NOT NULL,
    "totalQuestions" integer DEFAULT 0 NOT NULL,
    passed integer DEFAULT 0 NOT NULL,
    failed integer DEFAULT 0 NOT NULL,
    "avgRelevance" double precision,
    "avgFaithfulness" double precision,
    "avgHelpfulness" double precision,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "durationMs" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE orchestrator."EvalRun" OWNER TO postgres;

--
-- Name: KnowledgeBase; Type: TABLE; Schema: orchestrator; Owner: postgres
--

CREATE TABLE orchestrator."KnowledgeBase" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    "embeddingModel" text DEFAULT 'text-embedding-3-small'::text NOT NULL,
    "pineconeId" text,
    "chunkCount" integer DEFAULT 1 NOT NULL,
    category text,
    tags jsonb,
    source text,
    "retrievalCount" integer DEFAULT 0 NOT NULL,
    "lastRetrievedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE orchestrator."KnowledgeBase" OWNER TO postgres;

--
-- Name: PIIRedaction; Type: TABLE; Schema: orchestrator; Owner: postgres
--

CREATE TABLE orchestrator."PIIRedaction" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "originalText" text NOT NULL,
    "redactedText" text NOT NULL,
    "piiType" jsonb NOT NULL,
    "redactionMap" jsonb NOT NULL,
    "requestId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE orchestrator."PIIRedaction" OWNER TO postgres;

--
-- Name: PromptRun; Type: TABLE; Schema: orchestrator; Owner: postgres
--

CREATE TABLE orchestrator."PromptRun" (
    id text NOT NULL,
    "promptTemplateId" text NOT NULL,
    "userId" text NOT NULL,
    "rolloutStage" orchestrator."RolloutStage" DEFAULT 'CANARY_5'::orchestrator."RolloutStage" NOT NULL,
    "inputVariables" jsonb,
    "userPrompt" text,
    "upgradedPrompt" text,
    "finalPrompt" text,
    "llmResponse" text,
    "latencyMs" integer,
    "tokensIn" integer,
    "tokensOut" integer,
    "tokensUsed" integer,
    "costUsd" double precision,
    "relevanceScore" double precision,
    "faithfulnessScore" double precision,
    "helpfulnessScore" double precision,
    success boolean DEFAULT true NOT NULL,
    "errorMessage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE orchestrator."PromptRun" OWNER TO postgres;

--
-- Name: PromptTemplate; Type: TABLE; Schema: orchestrator; Owner: postgres
--

CREATE TABLE orchestrator."PromptTemplate" (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(500),
    version integer DEFAULT 1 NOT NULL,
    content text NOT NULL,
    variables jsonb,
    "isActive" boolean DEFAULT false NOT NULL,
    "promptType" orchestrator."PromptType" NOT NULL,
    "rolloutStage" orchestrator."RolloutStage" DEFAULT 'DEVELOPMENT'::orchestrator."RolloutStage" NOT NULL,
    "avgLatencyMs" integer,
    "avgRelevance" double precision,
    "avgFaithfulness" double precision,
    "totalRuns" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE orchestrator."PromptTemplate" OWNER TO postgres;

--
-- Name: TenantPlan; Type: TABLE; Schema: orchestrator; Owner: postgres
--

CREATE TABLE orchestrator."TenantPlan" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "planTier" orchestrator."PlanTier" DEFAULT 'FREE'::orchestrator."PlanTier" NOT NULL,
    "monthlyTokenQuota" integer DEFAULT 100000 NOT NULL,
    "monthlyUpgradeQuota" integer DEFAULT 1000 NOT NULL,
    "monthlyEmbeddingQuota" integer DEFAULT 10000 NOT NULL,
    "tokensUsed" integer DEFAULT 0 NOT NULL,
    "upgradesUsed" integer DEFAULT 0 NOT NULL,
    "embeddingsUsed" integer DEFAULT 0 NOT NULL,
    "currentPeriodStart" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "currentPeriodEnd" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE orchestrator."TenantPlan" OWNER TO postgres;

--
-- Name: TenantRole; Type: TABLE; Schema: orchestrator; Owner: postgres
--

CREATE TABLE orchestrator."TenantRole" (
    id text NOT NULL,
    "tenantPlanId" text NOT NULL,
    "userId" text NOT NULL,
    role orchestrator."RoleType" DEFAULT 'MEMBER'::orchestrator."RoleType" NOT NULL,
    permissions jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE orchestrator."TenantRole" OWNER TO postgres;

--
-- Name: UsageMeter; Type: TABLE; Schema: orchestrator; Owner: postgres
--

CREATE TABLE orchestrator."UsageMeter" (
    id text NOT NULL,
    "tenantPlanId" text NOT NULL,
    component text NOT NULL,
    operation text NOT NULL,
    "tokensIn" integer DEFAULT 0 NOT NULL,
    "tokensOut" integer DEFAULT 0 NOT NULL,
    "costUsd" double precision DEFAULT 0 NOT NULL,
    "latencyMs" integer,
    "cacheHit" boolean DEFAULT false NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE orchestrator."UsageMeter" OWNER TO postgres;

--
-- Name: Conversation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Conversation" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title character varying(255) DEFAULT 'New Chat'::character varying NOT NULL,
    model character varying(50) DEFAULT 'gpt-4'::character varying NOT NULL,
    pinned boolean DEFAULT false NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    temperature double precision,
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Conversation" OWNER TO postgres;

--
-- Name: ConversationState; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ConversationState" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "userId" text NOT NULL,
    "turnNumber" integer DEFAULT 0 NOT NULL,
    "currentRole" character varying(500),
    "currentTask" character varying(500),
    "currentDomain" character varying(200),
    "contextSummary" text DEFAULT ''::text NOT NULL,
    "usedKnowledgeIds" text[],
    "messageHistory" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "lastActivity" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ConversationState" OWNER TO postgres;

--
-- Name: ConversationSummary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ConversationSummary" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "userId" text NOT NULL,
    summary text NOT NULL,
    "messageCount" integer NOT NULL,
    "lastMessageId" text NOT NULL,
    "embeddingModel" text DEFAULT 'text-embedding-3-small'::text NOT NULL,
    "pineconeId" text,
    "hitCount" integer DEFAULT 0 NOT NULL,
    "lastHitAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ConversationSummary" OWNER TO postgres;

--
-- Name: EmailVerificationToken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EmailVerificationToken" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tokenHash" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."EmailVerificationToken" OWNER TO postgres;

--
-- Name: EvalDataset; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EvalDataset" (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(500),
    category text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EvalDataset" OWNER TO postgres;

--
-- Name: EvalQuestion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EvalQuestion" (
    id text NOT NULL,
    "evalDatasetId" text NOT NULL,
    question text NOT NULL,
    "expectedAnswer" text,
    category text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EvalQuestion" OWNER TO postgres;

--
-- Name: EvalResult; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EvalResult" (
    id text NOT NULL,
    "evalRunId" text NOT NULL,
    "evalQuestionId" text NOT NULL,
    "actualAnswer" text,
    "upgradePrompt" text,
    "llmResponse" text,
    "relevanceScore" double precision,
    "faithfulnessScore" double precision,
    "helpfulnessScore" double precision,
    passed boolean DEFAULT false NOT NULL,
    "piiLeakDetected" boolean DEFAULT false NOT NULL,
    "injectionDetected" boolean DEFAULT false NOT NULL,
    "latencyMs" integer,
    "tokensIn" integer,
    "tokensOut" integer,
    "errorMessage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."EvalResult" OWNER TO postgres;

--
-- Name: EvalRun; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EvalRun" (
    id text NOT NULL,
    "evalDatasetId" text NOT NULL,
    "runType" public."RunType" DEFAULT 'NIGHTLY'::public."RunType" NOT NULL,
    status public."EvalStatus" DEFAULT 'PENDING'::public."EvalStatus" NOT NULL,
    "totalQuestions" integer DEFAULT 0 NOT NULL,
    passed integer DEFAULT 0 NOT NULL,
    failed integer DEFAULT 0 NOT NULL,
    "avgRelevance" double precision,
    "avgFaithfulness" double precision,
    "avgHelpfulness" double precision,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "durationMs" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EvalRun" OWNER TO postgres;

--
-- Name: KnowledgeBase; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."KnowledgeBase" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    "embeddingModel" text DEFAULT 'text-embedding-3-small'::text NOT NULL,
    "pineconeId" text,
    "chunkCount" integer DEFAULT 1 NOT NULL,
    category text,
    tags jsonb,
    source text,
    "retrievalCount" integer DEFAULT 0 NOT NULL,
    "lastRetrievedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."KnowledgeBase" OWNER TO postgres;

--
-- Name: Message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    role character varying(20) NOT NULL,
    content text NOT NULL,
    "contentType" character varying(20) DEFAULT 'text'::character varying NOT NULL,
    "tokenCount" integer DEFAULT 0 NOT NULL,
    model character varying(50),
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Message" OWNER TO postgres;

--
-- Name: PIIRedaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PIIRedaction" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "originalText" text NOT NULL,
    "redactedText" text NOT NULL,
    "piiType" jsonb NOT NULL,
    "redactionMap" jsonb NOT NULL,
    "requestId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PIIRedaction" OWNER TO postgres;

--
-- Name: PasswordResetToken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PasswordResetToken" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tokenHash" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PasswordResetToken" OWNER TO postgres;

--
-- Name: PromptRun; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PromptRun" (
    id text NOT NULL,
    "promptTemplateId" text NOT NULL,
    "userId" text NOT NULL,
    "rolloutStage" public."RolloutStage" DEFAULT 'CANARY_5'::public."RolloutStage" NOT NULL,
    "inputVariables" jsonb,
    "userPrompt" text,
    "upgradedPrompt" text,
    "finalPrompt" text,
    "llmResponse" text,
    "latencyMs" integer,
    "tokensIn" integer,
    "tokensOut" integer,
    "tokensUsed" integer,
    "costUsd" double precision,
    "relevanceScore" double precision,
    "faithfulnessScore" double precision,
    "helpfulnessScore" double precision,
    success boolean DEFAULT true NOT NULL,
    "errorMessage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PromptRun" OWNER TO postgres;

--
-- Name: PromptTemplate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PromptTemplate" (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(500),
    version integer DEFAULT 1 NOT NULL,
    content text NOT NULL,
    variables jsonb,
    "isActive" boolean DEFAULT false NOT NULL,
    "promptType" public."PromptType" NOT NULL,
    "rolloutStage" public."RolloutStage" DEFAULT 'DEVELOPMENT'::public."RolloutStage" NOT NULL,
    "avgLatencyMs" integer,
    "avgRelevance" double precision,
    "avgFaithfulness" double precision,
    "totalRuns" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PromptTemplate" OWNER TO postgres;

--
-- Name: TenantPlan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TenantPlan" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "planTier" public."PlanTier" DEFAULT 'FREE'::public."PlanTier" NOT NULL,
    "monthlyTokenQuota" integer DEFAULT 100000 NOT NULL,
    "monthlyUpgradeQuota" integer DEFAULT 1000 NOT NULL,
    "monthlyEmbeddingQuota" integer DEFAULT 10000 NOT NULL,
    "tokensUsed" integer DEFAULT 0 NOT NULL,
    "upgradesUsed" integer DEFAULT 0 NOT NULL,
    "embeddingsUsed" integer DEFAULT 0 NOT NULL,
    "currentPeriodStart" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "currentPeriodEnd" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TenantPlan" OWNER TO postgres;

--
-- Name: TenantRole; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TenantRole" (
    id text NOT NULL,
    "tenantPlanId" text NOT NULL,
    "userId" text NOT NULL,
    role public."RoleType" DEFAULT 'MEMBER'::public."RoleType" NOT NULL,
    permissions jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TenantRole" OWNER TO postgres;

--
-- Name: TokenUsage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TokenUsage" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "conversationId" text,
    "messageId" text,
    model character varying(50) NOT NULL,
    "promptTokens" integer NOT NULL,
    "completionTokens" integer NOT NULL,
    "totalTokens" integer NOT NULL,
    cost double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TokenUsage" OWNER TO postgres;

--
-- Name: UsageMeter; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UsageMeter" (
    id text NOT NULL,
    "tenantPlanId" text NOT NULL,
    component text NOT NULL,
    operation text NOT NULL,
    "tokensIn" integer DEFAULT 0 NOT NULL,
    "tokensOut" integer DEFAULT 0 NOT NULL,
    "costUsd" double precision DEFAULT 0 NOT NULL,
    "latencyMs" integer,
    "cacheHit" boolean DEFAULT false NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UsageMeter" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "emailLower" text NOT NULL,
    username text,
    "passwordHash" text NOT NULL,
    name text,
    avatar text,
    "isEmailVerified" boolean DEFAULT false NOT NULL,
    "emailVerifiedAt" timestamp(3) without time zone,
    "planTier" text DEFAULT 'FREE'::text NOT NULL,
    "monthlyTokenUsed" integer DEFAULT 0 NOT NULL,
    "failedLoginAttempts" integer DEFAULT 0 NOT NULL,
    "lastFailedLoginAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastLoginAt" timestamp(3) without time zone
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Data for Name: ConversationState; Type: TABLE DATA; Schema: orchestrator; Owner: postgres
--

COPY orchestrator."ConversationState" (id, "conversationId", "userId", "turnNumber", "currentRole", "currentTask", "currentDomain", "contextSummary", "usedKnowledgeIds", "messageHistory", "lastActivity", "createdAt", "updatedAt", "expiresAt") FROM stdin;
cmhwfvo840001vp4o3hemhiug	conv_cmhuyfj0t0009vpx8yxzzg8ia_1762978499369	cmhuyfj0t0009vpx8yxzzg8ia	1	\N	\N	\N		{}	[{"role": "user", "content": "u", "timestamp": "2025-11-12T20:15:07.525Z", "upgradedPrompt": "Bạn là một chuyên gia tư vấn sức khỏe tâm lý với hơn 10 năm kinh nghiệm trong lĩnh vực tâm lý học. Nhiệm vụ của bạn là cung cấp các chiến lược và phương pháp cải thiện sức khỏe tâm lý cho những người đang gặp khó khăn với căng thẳng và lo âu. Trong ngữ cảnh hiện tại, nhiều người đang phải đối mặt với áp lực do đại dịch và những thay đổi trong cuộc sống hàng ngày. Hãy đưa ra ít nhất ba phương pháp cụ thể và dễ thực hiện mà mọi người có thể áp dụng ngay lập tức để giảm căng thẳng và nâng cao sức khỏe tinh thần. Đáp án nên dài từ 300 đến 500 từ, sử dụng ngôn ngữ dễ hiểu và thân thiện, và bao gồm các ví dụ thực tiễn. Cấu trúc đầu ra nên bao gồm phần giới thiệu ngắn gọn, ba phương pháp chi tiết với tiêu đề rõ ràng cho mỗi phương pháp, và một kết luận tóm tắt."}]	2025-11-12 20:15:07.526	2025-11-12 20:14:59.427	2025-11-12 20:15:07.533	2025-11-12 21:14:59.421
\.


--
-- Data for Name: ConversationSummary; Type: TABLE DATA; Schema: orchestrator; Owner: postgres
--

COPY orchestrator."ConversationSummary" (id, "conversationId", "userId", summary, "messageCount", "lastMessageId", "embeddingModel", "pineconeId", "hitCount", "lastHitAt", "createdAt", "updatedAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: EvalDataset; Type: TABLE DATA; Schema: orchestrator; Owner: postgres
--

COPY orchestrator."EvalDataset" (id, name, description, category, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: EvalQuestion; Type: TABLE DATA; Schema: orchestrator; Owner: postgres
--

COPY orchestrator."EvalQuestion" (id, "evalDatasetId", question, "expectedAnswer", category, metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: EvalResult; Type: TABLE DATA; Schema: orchestrator; Owner: postgres
--

COPY orchestrator."EvalResult" (id, "evalRunId", "evalQuestionId", "actualAnswer", "upgradePrompt", "llmResponse", "relevanceScore", "faithfulnessScore", "helpfulnessScore", passed, "piiLeakDetected", "injectionDetected", "latencyMs", "tokensIn", "tokensOut", "errorMessage", "createdAt") FROM stdin;
\.


--
-- Data for Name: EvalRun; Type: TABLE DATA; Schema: orchestrator; Owner: postgres
--

COPY orchestrator."EvalRun" (id, "evalDatasetId", "runType", status, "totalQuestions", passed, failed, "avgRelevance", "avgFaithfulness", "avgHelpfulness", "startedAt", "completedAt", "durationMs", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: KnowledgeBase; Type: TABLE DATA; Schema: orchestrator; Owner: postgres
--

COPY orchestrator."KnowledgeBase" (id, "userId", title, content, "embeddingModel", "pineconeId", "chunkCount", category, tags, source, "retrievalCount", "lastRetrievedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PIIRedaction; Type: TABLE DATA; Schema: orchestrator; Owner: postgres
--

COPY orchestrator."PIIRedaction" (id, "userId", "originalText", "redactedText", "piiType", "redactionMap", "requestId", "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: PromptRun; Type: TABLE DATA; Schema: orchestrator; Owner: postgres
--

COPY orchestrator."PromptRun" (id, "promptTemplateId", "userId", "rolloutStage", "inputVariables", "userPrompt", "upgradedPrompt", "finalPrompt", "llmResponse", "latencyMs", "tokensIn", "tokensOut", "tokensUsed", "costUsd", "relevanceScore", "faithfulnessScore", "helpfulnessScore", success, "errorMessage", "createdAt") FROM stdin;
\.


--
-- Data for Name: PromptTemplate; Type: TABLE DATA; Schema: orchestrator; Owner: postgres
--

COPY orchestrator."PromptTemplate" (id, name, description, version, content, variables, "isActive", "promptType", "rolloutStage", "avgLatencyMs", "avgRelevance", "avgFaithfulness", "totalRuns", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TenantPlan; Type: TABLE DATA; Schema: orchestrator; Owner: postgres
--

COPY orchestrator."TenantPlan" (id, "userId", "planTier", "monthlyTokenQuota", "monthlyUpgradeQuota", "monthlyEmbeddingQuota", "tokensUsed", "upgradesUsed", "embeddingsUsed", "currentPeriodStart", "currentPeriodEnd", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TenantRole; Type: TABLE DATA; Schema: orchestrator; Owner: postgres
--

COPY orchestrator."TenantRole" (id, "tenantPlanId", "userId", role, permissions, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UsageMeter; Type: TABLE DATA; Schema: orchestrator; Owner: postgres
--

COPY orchestrator."UsageMeter" (id, "tenantPlanId", component, operation, "tokensIn", "tokensOut", "costUsd", "latencyMs", "cacheHit", metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Conversation" (id, "userId", title, model, pinned, status, temperature, "deletedAt", "deletedBy", "createdAt", "updatedAt") FROM stdin;
cmhvl18jq0002vp646jw7v7ui	cmhvkqdqp0002vpjommqtow8s	Hi! What is 2+2?	gpt-4	f	active	\N	\N	\N	2025-11-12 05:51:30.947	2025-11-12 05:51:30.947
cmhvzed3m000mvp6cxi7nwt55	cmhvzcect0001vpwo4ocfm99q	As an experienced AI language model with extensive...	gpt-4o-mini	f	active	\N	\N	\N	2025-11-12 12:33:37.995	2025-11-12 12:33:37.995
cmhvzq9dg000xvp6cel2dp054	cmhvzpy4a0002vpwogj14muhv	Xin chào! Bạn có thể giới thiệu ngắn gọn về khả nă...	gpt-4o-mini	f	active	\N	\N	\N	2025-11-12 12:42:53.045	2025-11-12 12:42:53.045
cmhvzuump0018vp6cgz2v6cw9	cmhuyfj0t0009vpx8yxzzg8ia	chào bạn	gpt-4o-mini	f	active	\N	\N	\N	2025-11-12 12:46:27.218	2025-11-12 12:46:27.218
cmhw88x0b0028vp6cbv6xzjtt	cmhuyfj0t0009vpx8yxzzg8ia	chào bạn	gpt-4o-mini	f	active	\N	\N	\N	2025-11-12 16:41:20.411	2025-11-12 16:41:20.411
cmhw8ugai002ovp6cgukqwnuh	cmhw8u0t60003vpwosca70x48	Hello, please say hi back in one short sentence	gpt-4o-mini	f	active	\N	\N	\N	2025-11-12 16:58:05.174	2025-11-12 16:58:05.174
cmhw96lki002uvp6cfqljdej9	cmhn4b0ga0001vp9g3mybffdw	chào bạn	gpt-4o-mini	f	active	\N	\N	\N	2025-11-12 17:07:31.886	2025-11-12 17:07:31.886
cmhwadd6d0030vp6cj43qf0f8	cmhw8u0t60003vpwosca70x48	test new conversation	gpt-4o-mini	f	active	\N	\N	\N	2025-11-12 17:40:47.189	2025-11-12 17:40:47.189
cmhwbndec0000vpr8x5wyisbb	cmhuyfj0t0009vpx8yxzzg8ia	bạn khỏe không	gpt-4o-mini	f	active	\N	\N	\N	2025-11-12 18:16:33.683	2025-11-12 18:16:33.683
\.


--
-- Data for Name: ConversationState; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ConversationState" (id, "conversationId", "userId", "turnNumber", "currentRole", "currentTask", "currentDomain", "contextSummary", "usedKnowledgeIds", "messageHistory", "lastActivity", "createdAt", "updatedAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: ConversationSummary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ConversationSummary" (id, "conversationId", "userId", summary, "messageCount", "lastMessageId", "embeddingModel", "pineconeId", "hitCount", "lastHitAt", "createdAt", "updatedAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: EmailVerificationToken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EmailVerificationToken" (id, "userId", "tokenHash", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: EvalDataset; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EvalDataset" (id, name, description, category, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: EvalQuestion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EvalQuestion" (id, "evalDatasetId", question, "expectedAnswer", category, metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: EvalResult; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EvalResult" (id, "evalRunId", "evalQuestionId", "actualAnswer", "upgradePrompt", "llmResponse", "relevanceScore", "faithfulnessScore", "helpfulnessScore", passed, "piiLeakDetected", "injectionDetected", "latencyMs", "tokensIn", "tokensOut", "errorMessage", "createdAt") FROM stdin;
\.


--
-- Data for Name: EvalRun; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EvalRun" (id, "evalDatasetId", "runType", status, "totalQuestions", passed, failed, "avgRelevance", "avgFaithfulness", "avgHelpfulness", "startedAt", "completedAt", "durationMs", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: KnowledgeBase; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."KnowledgeBase" (id, "userId", title, content, "embeddingModel", "pineconeId", "chunkCount", category, tags, source, "retrievalCount", "lastRetrievedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Message" (id, "conversationId", role, content, "contentType", "tokenCount", model, "deletedAt", "deletedBy", "createdAt") FROM stdin;
cmhvl18p20004vp641bhej11y	cmhvl18jq0002vp646jw7v7ui	user	Hi! What is 2+2?	text	4	\N	\N	\N	2025-11-12 05:51:31.139
cmhvl1alg0006vp647ovopgsr	cmhvl18jq0002vp646jw7v7ui	assistant	2+2 equals 4.	text	7	gpt-4-0613	\N	\N	2025-11-12 05:51:33.604
cmhvl33ai0009vp645wo1rhbg	cmhvl18jq0002vp646jw7v7ui	user	What's the capital of France?	text	8	\N	\N	\N	2025-11-12 05:52:57.451
cmhvl34xw000bvp6451mqehzz	cmhvl18jq0002vp646jw7v7ui	assistant	The capital of France is Paris.	text	7	gpt-4-0613	\N	\N	2025-11-12 05:52:59.589
cmhvzed6z000ovp6cqyxpaf2s	cmhvzed3m000mvp6cxi7nwt55	user	As an experienced AI language model with extensive knowledge in various domains, your task is to introduce your capabilities in a clear and engaging manner. Provide an overview of your functionalities, including natural language understanding, text generation, and any specific applications such as content creation, data analysis, or customer support. Emphasize your ability to assist users in diverse tasks and provide relevant examples to illustrate your capabilities. Ensure the response is concise, ideally within 150-200 words, and maintain a professional yet approachable tone. The final output should be structured in paragraphs for readability, with clear headings if necessary to categorize different aspects of your abilities.	text	185	\N	\N	\N	2025-11-12 12:33:38.12
cmhvzeikg000qvp6chp9p8e3j	cmhvzed3m000mvp6cxi7nwt55	assistant	### Overview of Capabilities\n\nAs an advanced AI language model, I am designed to understand and generate human-like text, making me a versatile tool for various applications. My core functionalities include natural language understanding and text generation, allowing me to engage in meaningful conversations, provide information, and assist with diverse tasks.\n\n### Natural Language Understanding\n\nI excel at comprehending context, nuances, and the subtleties of language. This capability enables me to interpret user queries accurately, whether they involve simple questions or complex discussions. For instance, I can summarize articles, clarify concepts, or provide explanations across a wide range of topics.\n\n### Text Generation\n\nMy text generation abilities allow me to create coherent and contextually relevant content. This is particularly useful for content creation, such as writing blog posts, crafting marketing materials, or even generating creative stories. For example, I can help you brainstorm ideas for a project or draft a compelling narrative.\n\n### Specific Applications\n\nIn addition to content creation, I am equipped to assist with data analysis, providing insights based on textual data, and can support customer service by answering inquiries and resolving issues efficiently. My versatility makes me a valuable resource for individuals and businesses alike, enhancing productivity and fostering creativity.	text	358	gpt-4o-mini	\N	\N	2025-11-12 12:33:45.088
cmhvzg585000tvp6ca1vlryaj	cmhvzed3m000mvp6cxi7nwt55	user	As a seasoned AI content specialist with over 5 years of experience in writing about artificial intelligence, your task is to create a comprehensive blog post. The objective is to inform and engage an audience interested in AI technology, highlighting its current trends, applications, and future prospects. The blog should be written in a conversational yet professional tone, aiming for a length of 1200 to 1500 words. Please ensure the content is well-researched, includes relevant examples, and is accessible to readers with varying levels of knowledge about AI. Use subheadings for clarity and incorporate bullet points where necessary to enhance readability. The final output should be structured as an HTML document, with appropriate tags for headings, paragraphs, and lists.	text	196	\N	\N	\N	2025-11-12 12:35:01.109
cmhvzgwme000vvp6caux8mbgn	cmhvzed3m000mvp6cxi7nwt55	assistant	```html\n<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Exploring the Landscape of Artificial Intelligence: Trends, Applications, and Future Prospects</title>\n</head>\n<body>\n\n    <header>\n        <h1>Exploring the Landscape of Artificial Intelligence: Trends, Applications, and Future Prospects</h1>\n    </header>\n\n    <section>\n        <p>Artificial Intelligence (AI) has transitioned from a futuristic concept to a reality that is reshaping industries and daily life. With the rapid advancements in technology, AI is no longer confined to science fiction; it’s a driving force behind innovation today. In this blog post, we will explore the current trends in AI, its diverse applications, and what the future holds for this transformative technology.</p>\n    </section>\n\n    <section>\n        <h2>Current Trends in AI</h2>\n        <p>The field of AI is evolving at an unprecedented pace, with several key trends emerging that are shaping its development:</p>\n        <ul>\n            <li><strong>Machine Learning (ML):</strong> This subset of AI focuses on algorithms that enable systems to learn from and make predictions based on data. ML is becoming increasingly sophisticated, with advancements in deep learning and neural networks.</li>\n            <li><strong>Natural Language Processing (NLP):</strong> NLP is revolutionizing how machines understand and interact with human language. Applications like chatbots and virtual assistants are becoming more intuitive and human-like.</li>\n            <li><strong>AI Ethics:</strong> As AI technologies become more pervasive, ethical considerations are gaining attention. Discussions around bias, transparency, and accountability are crucial in ensuring responsible AI deployment.</li>\n            <li><strong>Edge AI:</strong> Processing data closer to the source (on devices rather than in centralized data centers) is gaining traction, enhancing speed and reducing latency for applications like IoT devices.</li>\n            <li><strong>AI in Automation:</strong> Automation powered by AI is streamlining processes across various sectors, from manufacturing to customer service, improving efficiency and reducing costs.</li>\n        </ul>\n    </section>\n\n    <section>\n        <h2>Applications of AI Across Industries</h2>\n        <p>AI's versatility allows it to be applied in numerous fields, significantly transforming operations and enhancing capabilities. Let’s explore some of the most impactful applications:</p>\n        \n        <h3>1. Healthcare</h3>\n        <p>AI is making strides in healthcare, from diagnostics to patient care:</p>\n        <ul>\n            <li><strong>Predictive Analytics:</strong> AI algorithms analyze patient data to identify trends and predict outcomes, aiding in early diagnosis.</li>\n            <li><strong>Personalized Medicine:</strong> Machine learning models can tailor treatment plans to individual patients based on their genetic makeup and lifestyle.</li>\n            <li><strong>Robotic Surgery:</strong> AI-driven robots assist surgeons with precision, minimizing recovery time and improving surgical outcomes.</li>\n        </ul>\n\n        <h3>2. Finance</h3>\n        <p>The financial sector is leveraging AI for various functions, enhancing security and customer experience:</p>\n        <ul>\n            <li><strong>Fraud Detection:</strong> AI systems analyze transaction patterns to detect and prevent fraudulent activities in real-time.</li>\n            <li><strong>Algorithmic Trading:</strong> AI algorithms can process vast amounts of data to execute trades at optimal times, maximizing profits.</li>\n            <li><strong>Customer Support:</strong> AI chatbots handle customer inquiries 24/7, providing timely assistance and reducing the burden on human agents.</li>\n        </ul>\n\n        <h3>3. Transportation</h3>\n        <p>AI is revolutionizing transportation, making it safer and more efficient:</p>\n        <ul>\n            <li><strong>Autonomous Vehicles:</strong> Companies like Tesla and Waymo are at the forefront of developing self-driving cars, utilizing AI to navigate and make decisions on the road.</li>\n            <li><strong>Traffic Management:</strong> AI systems analyze traffic patterns to optimize flow and reduce congestion in urban areas.</li>\n            <li><strong>Predictive Maintenance:</strong> AI can predict when vehicle components will fail, allowing for timely maintenance and reducing downtime.</li>\n        </ul>\n\n        <h3>4. Retail</h3>\n        <p>In the retail sector, AI enhances customer experiences and operational efficiency:</p>\n        <ul>\n            <li><strong>Personalization:</strong> Retailers use AI to analyze customer behavior and preferences, providing personalized recommendations and targeted marketing.</li>\n            <li><strong>Inventory Management:</strong> AI algorithms optimize stock levels and reduce waste by predicting demand more accurately.</li>\n            <li><strong>Visual Search:</strong> Customers can use images to search for products, making the shopping experience more intuitive.</li>\n        </ul>\n    </section>\n\n    <section>\n        <h2>The Future of AI</h2>\n        <p>The future of AI is exciting, with several trends expected to shape its trajectory:</p>\n        <ul>\n            <li><strong>Human-AI Collaboration:</strong> Rather than replacing humans, AI will enhance human capabilities, leading to new forms of collaboration across various fields.</li>\n            <li><strong>AI Democratization:</strong> As tools become more accessible, small businesses and individuals will leverage AI for tasks that were once the domain of large corporations.</li>\n            <li><strong>Improved AI Transparency:</strong> Efforts to enhance transparency will ensure that AI systems are understandable and accountable, fostering trust among users.</li>\n            <li><strong>AI in Climate Change:</strong> AI will play a crucial role in addressing global challenges, from optimizing energy efficiency to predicting environmental changes.</li>\n        </ul>\n    </section>\n\n    <section>\n        <h2>Conclusion</h2>\n        <p>Artificial Intelligence is a dynamic field that is revolutionizing various industries and shaping our future. As technology continues to evolve, staying informed about the latest trends and applications is essential for anyone interested in harnessing the power of AI. Whether you're a business leader, a tech enthusiast, or simply curious about the future, AI offers exciting possibilities that are worth exploring.</p>\n        <p>In this rapidly changing landscape, embracing AI technology can lead to innovative solutions and improved efficiency. As we look ahead, the potential for AI to address complex challenges and enhance our lives is limitless. Let’s continue to explore and engage with this fascinating field!</p>\n    </section>\n\n</body>\n</html>\n``` \n\nThis HTML document provides a structured and comprehensive blog post on AI, covering current trends, applications in various industries, and future prospects. The conversational yet professional tone ensures accessibility for readers with varying levels of knowledge about AI.	text	1817	gpt-4o-mini	\N	\N	2025-11-12 12:35:36.61
cmhvzq9dx000zvp6c187ckknv	cmhvzq9dg000xvp6cel2dp054	user	Xin chào! Bạn có thể giới thiệu ngắn gọn về khả năng của mình không?	text	17	\N	\N	\N	2025-11-12 12:42:53.062
cmhvzqcbi0011vp6cof6r2uhe	cmhvzq9dg000xvp6cel2dp054	assistant	Xin chào! Tôi là một trí tuệ nhân tạo được phát triển bởi OpenAI, có khả năng hỗ trợ trả lời câu hỏi, cung cấp thông tin, tạo nội dung văn bản, dịch ngôn ngữ, và nhiều nhiệm vụ khác liên quan đến ngôn ngữ. Tôi có thể giúp bạn tìm hiểu về các chủ đề khác nhau, giải thích khái niệm, hoặc thậm chí tham gia vào các cuộc trò chuyện. Nếu bạn cần hỗ trợ gì, hãy cho tôi biết!	text	93	gpt-4o-mini	\N	\N	2025-11-12 12:42:56.86
cmhvzr4dx0014vp6cm7nisk6p	cmhvzq9dg000xvp6cel2dp054	user	Vậy bạn có thể giúp tôi viết một đoạn code Python đơn giản không?	text	17	\N	\N	\N	2025-11-12 12:43:33.238
cmhvzr7jl0016vp6cyw13dll1	cmhvzq9dg000xvp6cel2dp054	assistant	Tất nhiên! Bạn muốn viết đoạn code Python cho mục đích gì? Dưới đây là một ví dụ đơn giản về một chương trình tính tổng của hai số:\n\n```python\n# Chương trình tính tổng của hai số\n\n# Nhập số thứ nhất\nnum1 = float(input("Nhập số thứ nhất: "))\n\n# Nhập số thứ hai\nnum2 = float(input("Nhập số thứ hai: "))\n\n# Tính tổng\ntotal = num1 + num2\n\n# In kết quả\nprint("Tổng của hai số là:", total)\n```\n\nNếu bạn có một yêu cầu cụ thể nào khác, hãy cho tôi biết!	text	112	gpt-4o-mini	\N	\N	2025-11-12 12:43:37.329
cmhvzuun9001avp6c2ospnxmx	cmhvzuump0018vp6cgz2v6cw9	user	chào bạn	text	2	\N	\N	\N	2025-11-12 12:46:27.236
cmhvzuvwd001cvp6c0atbqgte	cmhvzuump0018vp6cgz2v6cw9	assistant	Chào bạn! Bạn có cần giúp gì không?	text	9	gpt-4o-mini	\N	\N	2025-11-12 12:46:28.861
cmhvzvguu001fvp6c3f3cyybi	cmhvzuump0018vp6cgz2v6cw9	user	As an experienced art historian and digital artist, your task is to create a detailed digital rendition of Leonardo da Vinci's iconic painting, the Mona Lisa. The context is that this artwork will be used for an educational presentation about Renaissance art, so it should closely resemble the original in terms of composition, color palette, and style, while also incorporating a modern digital aesthetic. The constraints include a resolution suitable for a presentation slide (at least 1920x1080 pixels) and a color scheme that mirrors the original painting's tones. The final output should be in a high-quality PNG format and include a brief description (150-200 words) explaining the artistic choices made during the creation process. Please ensure the final artwork is visually striking and maintains the essence of the original Mona Lisa while being suitable for a contemporary audience.	text	224	\N	\N	\N	2025-11-12 12:46:56.022
cmhvzvm5q001hvp6cr16pbbq9	cmhvzuump0018vp6cgz2v6cw9	assistant	### Digital Rendition of the Mona Lisa\n\n**Description:**\n\nIn this digital rendition of Leonardo da Vinci's "Mona Lisa," I aimed to capture the essence of the original painting while infusing a modern digital aesthetic. The artwork retains the classic composition of the original, featuring the enigmatic smile and gentle gaze of the subject, framed against a soft, atmospheric background reminiscent of the Tuscan landscape.\n\nTo achieve a color palette reflective of the original, I utilized a range of earthy tones, soft browns, and muted greens, ensuring that the skin tones remain warm and lifelike. The subtle chiaroscuro technique, a hallmark of Renaissance painting, is preserved to create depth and dimension, enhancing the three-dimensional quality of the figure.\n\nIn terms of modern digital elements, I introduced a slight textural overlay, reminiscent of brush strokes, to evoke the traditional painting technique while making it suitable for a contemporary audience. The digital medium allows for crisp details and a refined finish, ensuring that the artwork stands out on presentation slides.\n\nThis rendition serves not only as a tribute to da Vinci’s genius but also as a bridge between historical art and modern digital expression, making it an engaging visual for educational purposes. \n\n*Resolution: 1920x1080 pixels*  \n*Format: High-quality PNG* \n\n---\n\nIf you would like me to assist with more specific aspects of the artwork or further details on the techniques used, feel free to ask!	text	376	gpt-4o-mini	\N	\N	2025-11-12 12:47:02.878
cmhvzwf8y001kvp6ch9bpzfbp	cmhvzuump0018vp6cgz2v6cw9	user	hãy tạo một phiên bản độc đáo của bức tranh Mona Lisa, giữ lại phong cách của Leonardo da Vinci nhưng với một cách thể hiện mới lạ.	text	33	\N	\N	\N	2025-11-12 12:47:40.594
cmhvzwlp6001mvp6cmnow2j6b	cmhvzuump0018vp6cgz2v6cw9	assistant	### Phiên bản Độc đáo của Bức Tranh Mona Lisa\n\n**Mô tả:**\n\nTrong phiên bản độc đáo của bức tranh "Mona Lisa," tôi đã kết hợp phong cách của Leonardo da Vinci với một cách thể hiện mới lạ, mang đến cho tác phẩm một hơi thở hiện đại nhưng vẫn giữ nguyên sự bí ẩn và quyến rũ của nhân vật. \n\nThay vì chỉ sử dụng màu sắc truyền thống, tôi đã áp dụng một bảng màu tươi sáng hơn, với những gam màu pastel nhẹ nhàng kết hợp với các sắc thái đậm hơn để tạo ra sự tương phản thú vị. Nền cảnh được làm mới bằng cách thêm vào các yếu tố hình học và trừu tượng, tạo nên một không gian huyền ảo và hiện đại, đồng thời vẫn gợi nhớ đến cảnh vật nhẹ nhàng của Tuscany.\n\nKhuôn mặt của Mona Lisa được giữ nguyên nét biểu cảm, nhưng được làm mềm mại hơn với các họa tiết hoa văn tinh tế, tượng trưng cho sự kết nối giữa nghệ thuật cổ điển và hiện đại. Các chi tiết về trang phục cũng được thiết kế lại với các đường nét đơn giản và hiện đại hơn, tạo cảm giác thoải mái và gần gũi hơn với khán giả đương đại.\n\nBằng cách này, phiên bản này không chỉ tôn vinh Leonardo da Vinci mà còn mở ra một cuộc đối thoại mới về cách nghệ thuật có thể phát triển và thích ứng qua thời gian, làm cho nó trở nên hấp dẫn và gần gũi hơn với thế hệ ngày nay.\n\n---\n\nNếu bạn cần thêm chi tiết hoặc có yêu cầu cụ thể nào khác về phiên bản này, hãy cho tôi biết!	text	330	gpt-4o-mini	\N	\N	2025-11-12 12:47:48.954
cmhvzxhqx001pvp6cfoz74vqs	cmhvzuump0018vp6cgz2v6cw9	user	bạn có thể cung cấp cho tôi một đoạn mã Python đơn giản về lập trình hướng đối tượng không? Tôi muốn hiểu rõ hơn về cách thức hoạt động của nó.	text	36	\N	\N	\N	2025-11-12 12:48:30.49
cmhvzxsgh001rvp6cgoj2c22u	cmhvzuump0018vp6cgz2v6cw9	assistant	Chắc chắn rồi! Dưới đây là một đoạn mã Python đơn giản về lập trình hướng đối tượng (OOP) mà bạn có thể tham khảo. Đoạn mã này định nghĩa một lớp `Car` (Xe) với các thuộc tính và phương thức cơ bản.\n\n```python\nclass Car:\n    # Khởi tạo đối tượng Car với các thuộc tính\n    def __init__(self, make, model, year):\n        self.make = make      # Hãng xe\n        self.model = model    # Mẫu xe\n        self.year = year      # Năm sản xuất\n        self.odometer_reading = 0  # Đọc đồng hồ\n\n    # Phương thức để mô tả xe\n    def describe_car(self):\n        return f"{self.year} {self.make} {self.model}"\n\n    # Phương thức để đọc đồng hồ\n    def read_odometer(self):\n        return f"This car has {self.odometer_reading} miles on it."\n\n    # Phương thức để cập nhật đồng hồ\n    def update_odometer(self, mileage):\n        if mileage >= self.odometer_reading:\n            self.odometer_reading = mileage\n        else:\n            print("You can't roll back an odometer!")\n\n    # Phương thức để tăng số dặm \n    def increment_odometer(self, miles):\n        self.odometer_reading += miles\n\n\n# Tạo một đối tượng Car\nmy_car = Car('Toyota', 'Corolla', 2020)\n\n# Sử dụng các phương thức của đối tượng\nprint(my_car.describe_car())  # In ra mô tả xe\nmy_car.update_odometer(15000)  # Cập nhật số dặm\nprint(my_car.read_odometer())  # Đọc số dặm\nmy_car.increment_odometer(500)  # Tăng số dặm\nprint(my_car.read_odometer())  # Đọc lại số dặm\n```\n\n### Giải thích đoạn mã:\n\n1. **Lớp (`class`)**: `Car` là một lớp mô tả các thuộc tính và hành vi của một chiếc xe.\n2. **Phương thức khởi tạo (`__init__`)**: Đây là phương thức đặc biệt được gọi khi một đối tượng mới được tạo. Nó khởi tạo các thuộc tính của đối tượng.\n3. **Thuộc tính (`self.make`, `self.model`, `self.year`, `self.odometer_reading`)**: Đây là các thuộc tính của đối tượng, lưu trữ thông tin về xe.\n4. **Phương thức**: Các phương thức như `describe_car`, `read_odometer`, `update_odometer`, và `increment_odometer` định nghĩa các hành vi mà đối tượng có thể thực hiện.\n5. **Tạo đối tượng**: `my_car = Car('Toyota', 'Corolla', 2020)` tạo một đối tượng mới từ lớp `Car`.\n6. **Gọi phương thức**: Các phương thức của đối tượng được gọi để thực hiện các hành động, như mô tả xe hoặc cập nhật số dặm.\n\nHy vọng đoạn mã và giải thích trên sẽ giúp bạn hiểu rõ hơn về lập trình hướng đối tượng trong Python! Nếu bạn có câu hỏi nào khác, hãy cho tôi biết!	text	597	gpt-4o-mini	\N	\N	2025-11-12 12:48:44.369
cmhw04qa6001uvp6cbx7e9z32	cmhvzq9dg000xvp6cel2dp054	user	Tuyệt vời! Bạn có thể giải thích code đó không?	text	12	\N	\N	\N	2025-11-12 12:54:08.141
cmhw04wqm001wvp6cwvli5eq8	cmhvzq9dg000xvp6cel2dp054	assistant	Chắc chắn rồi! Dưới đây là giải thích chi tiết về từng phần của đoạn code Python mà tôi đã cung cấp:\n\n```python\n# Chương trình tính tổng của hai số\n\n# Nhập số thứ nhất\nnum1 = float(input("Nhập số thứ nhất: "))\n```\n- Dòng đầu tiên là một chú thích (comment) để giải thích chức năng của chương trình.\n- Dòng thứ hai sử dụng hàm `input()` để yêu cầu người dùng nhập vào một số. Thông điệp "Nhập số thứ nhất: " sẽ được hiển thị trên màn hình.\n- Giá trị nhập vào từ người dùng được lưu trữ dưới dạng chuỗi (string), vì vậy chúng ta sử dụng `float()` để chuyển đổi chuỗi đó thành kiểu số thực (float). Biến `num1` sẽ chứa giá trị này.\n\n```python\n# Nhập số thứ hai\nnum2 = float(input("Nhập số thứ hai: "))\n```\n- Tương tự như trên, dòng này yêu cầu người dùng nhập vào số thứ hai và lưu trữ nó trong biến `num2`.\n\n```python\n# Tính tổng\ntotal = num1 + num2\n```\n- Dòng này thực hiện phép cộng hai số đã nhập (`num1` và `num2`) và lưu kết quả vào biến `total`.\n\n```python\n# In kết quả\nprint("Tổng của hai số là:", total)\n```\n- Cuối cùng, dòng này sử dụng hàm `print()` để in ra kết quả. Nó hiển thị thông điệp "Tổng của hai số là:" và giá trị của biến `total`.\n\nTóm lại, chương trình này cho phép người dùng nhập vào hai số và sau đó tính và hiển thị tổng của chúng. Nếu bạn có thêm câu hỏi hoặc cần giải thích về một phần cụ thể nào khác, hãy cho tôi biết!	text	337	gpt-4o-mini	\N	\N	2025-11-12 12:54:16.51
cmhw0f7ny001zvp6c480fqkjr	cmhvzq9dg000xvp6cel2dp054	user	Test sau khi fix: Hãy viết code JavaScript đơn giản	text	13	\N	\N	\N	2025-11-12 13:02:17.23
cmhw0fhs10021vp6cvetaur6a	cmhvzq9dg000xvp6cel2dp054	assistant	Tất nhiên! Dưới đây là một đoạn mã JavaScript đơn giản để tính tổng của hai số nhập từ người dùng:\n\n```javascript\n// Chương trình tính tổng của hai số\n\n// Hàm để tính tổng\nfunction calculateSum() {\n    // Nhập số thứ nhất\n    let num1 = parseFloat(prompt("Nhập số thứ nhất: "));\n    \n    // Nhập số thứ hai\n    let num2 = parseFloat(prompt("Nhập số thứ hai: "));\n    \n    // Tính tổng\n    let total = num1 + num2;\n    \n    // Hiển thị kết quả\n    alert("Tổng của hai số là: " + total);\n}\n\n// Gọi hàm để chạy chương trình\ncalculateSum();\n```\n\n### Giải thích đoạn mã:\n1. **Hàm calculateSum()**: Chúng ta định nghĩa một hàm có tên `calculateSum` để nhóm các thao tác lại với nhau.\n   \n2. **Nhập số từ người dùng**:\n   - `prompt("Nhập số thứ nhất: ")` hiển thị một hộp thoại yêu cầu người dùng nhập một số. Kết quả được lưu trữ trong biến `num1`.\n   - `parseFloat()` được sử dụng để chuyển đổi chuỗi nhập vào thành số thực (float).\n   - Tương tự cho `num2`.\n\n3. **Tính tổng**: Chúng ta cộng `num1` và `num2` và lưu kết quả vào biến `total`.\n\n4. **Hiển thị kết quả**: `alert("Tổng của hai số là: " + total);` hiển thị thông báo với tổng của hai số.\n\n5. **Gọi hàm**: Cuối cùng, chúng ta gọi hàm `calculateSum()` để thực thi chương trình.\n\nNếu bạn cần thêm thông tin hoặc có yêu cầu khác, hãy cho tôi biết!	text	325	gpt-4o-mini	\N	\N	2025-11-12 13:02:30.337
cmhw87ghm0024vp6ckzf63c31	cmhvzuump0018vp6cgz2v6cw9	user	As a Software Engineering Expert with a focus on Object-Oriented Programming (OOP), your task is to explain the importance of creating an instance of a class (my_car) instead of directly using the class constructor (Car('Toyota', 'Corolla', 2020)). Provide a detailed answer that explains the principles of encapsulation, reusability, and maintainability in OOP. Additionally, include examples to illustrate your points. Your response should be 200-300 words, written in a clear and professional tone, suitable for an audience with a basic understanding of programming concepts. Format your response as a cohesive paragraph.	text	156	\N	\N	\N	2025-11-12 16:40:12.346
cmhw87l1u0026vp6csc3kvsbo	cmhvzuump0018vp6cgz2v6cw9	assistant	Creating an instance of a class, such as `my_car = Car('Toyota', 'Corolla', 2020)`, rather than directly invoking the class constructor, is fundamental to the principles of Object-Oriented Programming (OOP), particularly encapsulation, reusability, and maintainability. Encapsulation allows the internal state of an object to be shielded from direct access, promoting a clear interface through which the object can be interacted with. By creating an instance, we encapsulate the data and behaviors that pertain specifically to that object, such as the make and model of `my_car`, while protecting them from unintended external modifications. This encapsulation enhances security and reduces the risk of errors. Moreover, creating instances fosters reusability; the same class can be instantiated multiple times to create various objects with unique states, such as `my_car` and `your_car`, each maintaining their own attributes and methods without conflict. This approach not only simplifies code management but also enables the programmer to leverage existing code for new objects, thereby enhancing productivity. Lastly, maintainability is significantly improved when using instances, as changes to the class definition can propagate through all instances without requiring alterations to the instantiation logic itself. For instance, if we update the `Car` class to include a new method for calculating fuel efficiency, all existing `Car` instances automatically inherit this functionality. This modular structure allows for easier updates and debugging, ultimately leading to more robust and adaptable software systems.	text	406	gpt-4o-mini	\N	\N	2025-11-12 16:40:18.258
cmhw88x1p002avp6cr9gxuc3o	cmhw88x0b0028vp6cbv6xzjtt	user	chào bạn	text	2	\N	\N	\N	2025-11-12 16:41:20.461
cmhw88zrl002cvp6cnliahl63	cmhw88x0b0028vp6cbv6xzjtt	assistant	Chào bạn! Bạn cần giúp gì hôm nay?	text	9	gpt-4o-mini	\N	\N	2025-11-12 16:41:23.985
cmhw89zyz002fvp6cb989beq8	cmhw88x0b0028vp6cbv6xzjtt	user	tôi cần nói chuyện 1 lát	text	6	\N	\N	\N	2025-11-12 16:42:10.907
cmhw8a205002hvp6crpsxwuu4	cmhw88x0b0028vp6cbv6xzjtt	assistant	Tất nhiên rồi! Bạn muốn nói về chủ đề gì?	text	11	gpt-4o-mini	\N	\N	2025-11-12 16:42:13.542
cmhw8hid5002kvp6cjeakz7vl	cmhw88x0b0028vp6cbv6xzjtt	user	mỹ thuật	text	2	\N	\N	\N	2025-11-12 16:48:01.337
cmhw8hjd4002mvp6caimpij57	cmhw88x0b0028vp6cbv6xzjtt	assistant	Mỹ thuật là một lĩnh vực rất thú vị! Bạn muốn nói về loại hình nào trong mỹ thuật? Chẳng hạn như hội họa, điêu khắc, thiết kế đồ họa hay một nghệ sĩ cụ thể nào đó?	text	41	gpt-4o-mini	\N	\N	2025-11-12 16:48:02.633
cmhw8ugb2002qvp6c43q1z2jb	cmhw8ugai002ovp6cgukqwnuh	user	Hello, please say hi back in one short sentence	text	12	\N	\N	\N	2025-11-12 16:58:05.198
cmhw8ui5s002svp6cea1982js	cmhw8ugai002ovp6cgukqwnuh	assistant	Hi there!	text	3	gpt-4o-mini	\N	\N	2025-11-12 16:58:07.6
cmhw96lm9002wvp6cxe2jrjxr	cmhw96lki002uvp6cfqljdej9	user	chào bạn	text	2	\N	\N	\N	2025-11-12 17:07:31.953
cmhw96p7n002yvp6cy2jp22w0	cmhw96lki002uvp6cfqljdej9	assistant	Chào bạn! Bạn cần giúp gì hôm nay?	text	9	gpt-4o-mini	\N	\N	2025-11-12 17:07:36.611
cmhwadd970032vp6cqeq0m9i4	cmhwadd6d0030vp6cj43qf0f8	user	test new conversation	text	6	\N	\N	\N	2025-11-12 17:40:47.321
cmhwadf2m0034vp6ce9k7yizy	cmhwadd6d0030vp6cj43qf0f8	assistant	Sure! What would you like to talk about?	text	10	gpt-4o-mini	\N	\N	2025-11-12 17:40:49.678
cmhwbndn20002vpr81jxpoffg	cmhwbndec0000vpr8x5wyisbb	user	bạn khỏe không	text	4	\N	\N	\N	2025-11-12 18:16:33.997
cmhwbnf1c0004vpr8xo2jivft	cmhwbndec0000vpr8x5wyisbb	assistant	Mình khỏe, cảm ơn bạn! Còn bạn thì sao?	text	10	gpt-4o-mini	\N	\N	2025-11-12 18:16:35.808
cmhwcoc0z0001vpi0n8187714	cmhwbndec0000vpr8x5wyisbb	user	Bạn là một chuyên gia lập trình viên Java với nhiều năm kinh nghiệm trong lập trình hướng đối tượng (OOP). Nhiệm vụ của bạn là viết một đoạn code mẫu bằng Java để minh họa các khái niệm OOP cơ bản như lớp, đối tượng, kế thừa, và đa hình. Mục tiêu là giúp người học dễ dàng phân tích và so sánh sự khác biệt giữa OOP trong Java và Python. Đoạn code cần được chú thích rõ ràng để giải thích từng phần, và nên có độ dài từ 20 đến 50 dòng. Phong cách viết nên rõ ràng, dễ hiểu và mang tính giáo dục. Cấu trúc đầu ra cần bao gồm: 1) Đoạn mã Java, 2) Giải thích từng phần code, 3) So sánh ngắn gọn với Python về các khái niệm tương ứng.	text	158	\N	\N	\N	2025-11-12 18:45:18.179
cmhwcoshr0003vpi0lumj9ox9	cmhwbndec0000vpr8x5wyisbb	assistant	### 1) Đoạn mã Java\n\n```java\n// Lớp cơ sở (superclass)\nclass Animal {\n    // Phương thức động (method) để mô tả tiếng kêu\n    public void makeSound() {\n        System.out.println("Some sound");\n    }\n}\n\n// Lớp con (subclass) kế thừa từ Animal\nclass Dog extends Animal {\n    // Ghi đè phương thức makeSound()\n    @Override\n    public void makeSound() {\n        System.out.println("Bark");\n    }\n}\n\n// Lớp con (subclass) kế thừa từ Animal\nclass Cat extends Animal {\n    // Ghi đè phương thức makeSound()\n    @Override\n    public void makeSound() {\n        System.out.println("Meow");\n    }\n}\n\n// Lớp chính để chạy chương trình\npublic class Main {\n    public static void main(String[] args) {\n        // Tạo đối tượng Dog\n        Animal myDog = new Dog();\n        // Tạo đối tượng Cat\n        Animal myCat = new Cat();\n\n        // Gọi phương thức makeSound() cho từng đối tượng\n        myDog.makeSound();  // Output: Bark\n        myCat.makeSound();  // Output: Meow\n    }\n}\n```\n\n### 2) Giải thích từng phần code\n\n- **Lớp cơ sở (Animal)**: Đây là lớp cha, có phương thức `makeSound()`. Phương thức này sẽ được ghi đè trong các lớp con.\n  \n- **Lớp con (Dog)**: Kế thừa từ lớp `Animal`, lớp này ghi đè phương thức `makeSound()` để trả về tiếng của chó ("Bark").\n  \n- **Lớp con (Cat)**: Tương tự như lớp `Dog`, lớp này cũng kế thừa từ lớp `Animal` và ghi đè phương thức `makeSound()` để trả về tiếng của mèo ("Meow").\n  \n- **Lớp chính (Main)**: Tại đây, chúng ta tạo các đối tượng `Dog` và `Cat` nhưng khai báo chúng dưới kiểu `Animal`. Điều này cho phép chúng ta sử dụng tính năng đa hình (polymorphism) - gọi phương thức `makeSound()` mà không cần biết chính xác kiểu đối tượng.\n\n### 3) So sánh ngắn gọn với Python\n\n- **Lớp và Đối tượng**: Trong Python, bạn cũng định nghĩa lớp và tạo đối tượng tương tự, nhưng cú pháp ngắn gọn hơn. Ví dụ, sử dụng `class Animal:` thay vì `class Animal {}`.\n\n- **Kế thừa**: Python sử dụng cú pháp `class Dog(Animal):` để kế thừa, khác với Java phải sử dụng từ khóa `extends`.\n\n- **Ghi đè phương thức**: Trong Python, bạn sử dụng `def makeSound(self):` và không cần từ khóa `@Override`.\n\n- **Đa hình**: Python cũng hỗ trợ đa hình tương tự như Java, cho phép bạn gọi phương thức trên lớp cha mà không cần biết kiểu cụ thể của đối tượng.\n\nVí dụ tương tự trong Python:\n\n```python\nclass Animal:\n    def make_sound(self):\n        print("Some sound")\n\nclass Dog(Animal):\n    def make_sound(self):\n        print("Bark")\n\nclass Cat(Animal):\n    def make_sound(self):\n        print("Meow")\n\n# Tạo đối tượng\nmy_dog = Dog()\nmy_cat = Cat()\n\n# Gọi phương thức\nmy_dog.make_sound()  # Output: Bark\nmy_cat.make_sound()  # Output: Meow\n```\n\n### Tổng kết\n\nCả Java và Python đều hỗ trợ lập trình hướng đối tượng với các khái niệm như lớp, đối tượng, kế thừa và đa hình. Tuy nhiên, cú pháp và cách triển khai có sự khác biệt rõ rệt, với Python thường có cú pháp ngắn gọn và dễ đọc hơn.	text	723	gpt-4o-mini	\N	\N	2025-11-12 18:45:39.517
cmhwcwxx50006vpi0njfzgdtl	cmhwbndec0000vpr8x5wyisbb	user	ủa	text	1	\N	\N	\N	2025-11-12 18:51:59.802
cmhwcwzoa0008vpi0gjk39kmf	cmhwbndec0000vpr8x5wyisbb	assistant	Có điều gì bạn muốn hỏi thêm về đoạn mã Java hoặc các khái niệm lập trình hướng đối tượng không? Mình rất sẵn lòng giúp bạn!	text	31	gpt-4o-mini	\N	\N	2025-11-12 18:52:02.074
cmhwcy3rn000bvpi0wqoypg7o	cmhwbndec0000vpr8x5wyisbb	user	không có gì	text	3	\N	\N	\N	2025-11-12 18:52:54.035
cmhwcy5ik000dvpi0erdljusw	cmhwbndec0000vpr8x5wyisbb	assistant	Không sao cả! Nếu bạn có bất kỳ câu hỏi nào trong tương lai hoặc cần giúp đỡ về lập trình hay bất kỳ chủ đề nào khác, đừng ngần ngại hỏi nhé. Chúc bạn một ngày tốt lành!	text	43	gpt-4o-mini	\N	\N	2025-11-12 18:52:56.298
cmhwdse6q000gvpi06ekbod2a	cmhwbndec0000vpr8x5wyisbb	user	Bạn có thể cho tôi biết thêm về Java, bao gồm những điểm nổi bật, ứng dụng phổ biến và cách nó khác biệt với Python trong lập trình hướng đối tượng không?	text	39	\N	\N	\N	2025-11-12 19:16:27.218
cmhwdsrfb000ivpi0fyerffru	cmhwbndec0000vpr8x5wyisbb	assistant	Chắc chắn rồi! Dưới đây là một số thông tin chi tiết về Java, bao gồm những điểm nổi bật, ứng dụng phổ biến và cách nó khác biệt với Python trong lập trình hướng đối tượng.\n\n### 1. Điểm nổi bật của Java\n\n- **Ngôn ngữ hướng đối tượng**: Java hoàn toàn hỗ trợ lập trình hướng đối tượng, cho phép tổ chức mã theo các lớp và đối tượng, giúp mã dễ quản lý và mở rộng.\n\n- **Tính di động**: Java được thiết kế với nguyên tắc "Viết một lần, chạy mọi nơi" (WORA). Chương trình Java được biên dịch thành bytecode, có thể chạy trên bất kỳ nền tảng nào có Java Virtual Machine (JVM).\n\n- **Quản lý bộ nhớ tự động**: Java sử dụng garbage collection để tự động quản lý bộ nhớ, giúp giảm thiểu rò rỉ bộ nhớ và lỗi liên quan đến quản lý bộ nhớ.\n\n- **An toàn và bảo mật**: Java có một mô hình bảo mật mạnh mẽ, cho phép phát triển các ứng dụng an toàn, đặc biệt là trong môi trường web.\n\n- **Thư viện phong phú**: Java có một bộ thư viện phong phú (Java Standard Library) hỗ trợ nhiều chức năng, từ xử lý dữ liệu đến giao diện người dùng.\n\n### 2. Ứng dụng phổ biến của Java\n\n- **Phát triển ứng dụng doanh nghiệp**: Java thường được sử dụng để phát triển các ứng dụng doanh nghiệp lớn nhờ vào khả năng mở rộng và độ tin cậy.\n\n- **Phát triển ứng dụng web**: Nhiều ứng dụng web được xây dựng với các framework như Spring và JavaServer Faces (JSF).\n\n- **Phát triển ứng dụng di động**: Java là ngôn ngữ chính để phát triển ứng dụng Android, nhờ vào Android SDK.\n\n- **Hệ thống nhúng**: Java được sử dụng trong các thiết bị nhúng nhờ khả năng chạy trên nhiều nền tảng.\n\n- **Khoa học dữ liệu và big data**: Một số công cụ và framework trong lĩnh vực này, như Apache Hadoop, được viết bằng Java.\n\n### 3. So sánh Java và Python trong lập trình hướng đối tượng\n\n- **Cú pháp**:\n  - **Java**: Cú pháp khá nghiêm ngặt và yêu cầu khai báo kiểu dữ liệu. Ví dụ, bạn phải chỉ định kiểu dữ liệu khi khai báo biến và phương thức.\n  - **Python**: Cú pháp dễ đọc và linh hoạt hơn, không yêu cầu khai báo kiểu dữ liệu. Điều này giúp lập trình nhanh hơn và dễ dàng hơn cho người mới bắt đầu.\n\n- **Tính đa hình**:\n  - **Java**: Hỗ trợ đa hình thông qua interface và lớp trừu tượng. Điều này yêu cầu các lớp con phải tuân theo một hợp đồng cụ thể.\n  - **Python**: Hỗ trợ đa hình một cách linh hoạt hơn, không yêu cầu khai báo rõ ràng về interface hay lớp trừu tượng.\n\n- **Quản lý bộ nhớ**:\n  - **Java**: Sử dụng garbage collection, nhưng người lập trình viên vẫn có thể quản lý bộ nhớ một cách thủ công nếu cần.\n  - **Python**: Cũng sử dụng garbage collection, nhưng cung cấp các công cụ mạnh mẽ hơn cho việc quản lý bộ nhớ tự động.\n\n- **Tính năng lập trình hàm**:\n  - **Java**: Hỗ trợ lập trình hàm nhưng không mạnh mẽ như Python.\n  - **Python**: Hỗ trợ lập trình hàm rất tốt, cho phép sử dụng các hàm như đối tượng và là một phần quan trọng trong ngôn ngữ.\n\n### Kết luận\n\nJava và Python đều là những ngôn ngữ lập trình mạnh mẽ, mỗi ngôn ngữ có những ưu điểm và ứng dụng riêng. Java thường được ưa chuộng trong các ứng dụng doanh nghiệp và di động, trong khi Python nổi bật với cú pháp dễ hiểu và nhanh chóng trong phát triển ứng dụng. Sự lựa chọn giữa hai ngôn ngữ này phụ thuộc vào yêu cầu cụ thể của dự án và sở thích cá nhân của lập trình viên.	text	801	gpt-4o-mini	\N	\N	2025-11-12 19:16:44.372
cmhwenar7000lvpi02bw71a1h	cmhwbndec0000vpr8x5wyisbb	user	Dựa trên những gì chúng ta đã thảo luận về OOP trong Java và Python, bạn có thể giải thích tại sao nên chọn ngôn ngữ nào cho lập trình game? Có những yếu tố nào trong OOP mà có thể ảnh hưởng đến quyết định này không?	text	54	\N	\N	\N	2025-11-12 19:40:29.106
cmhwenp3p000nvpi0t4izuqa9	cmhwbndec0000vpr8x5wyisbb	assistant	Khi lựa chọn ngôn ngữ lập trình cho phát triển game, cả Java và Python đều có những ưu điểm và nhược điểm riêng. Dưới đây là một số yếu tố quan trọng liên quan đến lập trình hướng đối tượng (OOP) và cách chúng có thể ảnh hưởng đến quyết định chọn ngôn ngữ nào cho phát triển game.\n\n### 1. Lợi ích của OOP trong phát triển game\n\n**Tổ chức mã**: OOP cho phép bạn tổ chức mã thành các lớp và đối tượng, điều này rất quan trọng trong game, nơi mà bạn có thể có nhiều loại đối tượng như nhân vật, kẻ thù, vật phẩm, và môi trường. Việc xây dựng các lớp cho từng loại đối tượng giúp dễ dàng quản lý và mở rộng game.\n\n**Tính kế thừa**: Bạn có thể tạo các lớp cha cho các đối tượng chung và sau đó mở rộng chúng cho các đối tượng cụ thể hơn. Ví dụ, một lớp `Character` có thể được kế thừa bởi lớp `Player` và `Enemy`. Điều này giúp tái sử dụng mã và giảm thiểu lỗi.\n\n**Đa hình**: OOP cho phép bạn sử dụng đa hình để gọi các phương thức trên các lớp khác nhau mà không cần biết chính xác loại đối tượng. Điều này có thể hữu ích khi bạn xử lý nhiều loại đối tượng khác nhau trong game.\n\n### 2. So sánh Java và Python trong phát triển game\n\n#### Java\n\n- **Ưu điểm**:\n  - **Hiệu suất**: Java thường có hiệu suất tốt hơn so với Python, điều này rất quan trọng trong game, nơi mà hiệu suất là yếu tố quan trọng.\n  - **Cơ sở hạ tầng**: Java có một số công cụ và framework mạnh mẽ cho phát triển game như LibGDX và jMonkeyEngine.\n  - **Độ tin cậy**: Java thường được ưa chuộng cho các ứng dụng lớn và phức tạp, nhờ vào tính ổn định và khả năng mở rộng.\n\n- **Nhược điểm**:\n  - **Cú pháp phức tạp**: Cú pháp của Java có thể phức tạp hơn, điều này có thể gây khó khăn cho những người mới bắt đầu.\n\n#### Python\n\n- **Ưu điểm**:\n  - **Cú pháp dễ đọc**: Python có cú pháp dễ hiểu và linh hoạt, phù hợp cho các lập trình viên mới bắt đầu.\n  - **Rapid Development**: Python cho phép phát triển nhanh chóng, điều này có thể hữu ích cho các dự án game nhỏ hoặc game indie.\n  - **Thư viện phong phú**: Python có nhiều thư viện như Pygame giúp đơn giản hóa quá trình phát triển game.\n\n- **Nhược điểm**:\n  - **Hiệu suất**: Python thường chậm hơn Java trong việc thực thi mã, có thể làm giảm hiệu suất game, đặc biệt là trong các game phức tạp hoặc yêu cầu đồ họa cao.\n  - **Hạn chế về công cụ**: Mặc dù có nhiều thư viện, nhưng số lượng và chất lượng công cụ phát triển game trong Python không phong phú như trong Java.\n\n### 3. Yếu tố nào ảnh hưởng đến quyết định\n\n- **Kích thước và độ phức tạp của game**: Nếu bạn đang phát triển một game lớn với nhiều đối tượng và yêu cầu hiệu suất cao, Java có thể là lựa chọn tốt hơn. Ngược lại, nếu bạn đang làm một game nhỏ hoặc một prototype, Python có thể là lựa chọn hợp lý hơn.\n\n- **Kinh nghiệm của nhóm phát triển**: Nếu nhóm phát triển quen thuộc với một ngôn ngữ cụ thể, việc chọn ngôn ngữ đó sẽ giúp tiết kiệm thời gian và giảm thiểu lỗi.\n\n- **Cộng đồng và tài nguyên**: Cả Java và Python đều có cộng đồng mạnh mẽ, nhưng bạn nên xem xét liệu có đủ tài nguyên, hướng dẫn và thư viện liên quan đến game cho ngôn ngữ bạn chọn hay không.\n\n### Kết luận\n\nCả Java và Python đều có thể được sử dụng để phát triển game, nhưng lựa chọn giữa chúng phụ thuộc vào dự án cụ thể của bạn. Nếu bạn ưu tiên hiệu suất và tính ổn định cho các game lớn, Java có thể là lựa chọn tốt hơn. Nếu bạn đang tìm kiếm sự dễ dàng và tốc độ phát triển cho các game nhỏ hơn hoặc prototype, Python có thể là lựa chọn hợp lý hơn.	text	853	gpt-4o-mini	\N	\N	2025-11-12 19:40:47.697
\.


--
-- Data for Name: PIIRedaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PIIRedaction" (id, "userId", "originalText", "redactedText", "piiType", "redactionMap", "requestId", "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: PasswordResetToken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PasswordResetToken" (id, "userId", "tokenHash", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: PromptRun; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PromptRun" (id, "promptTemplateId", "userId", "rolloutStage", "inputVariables", "userPrompt", "upgradedPrompt", "finalPrompt", "llmResponse", "latencyMs", "tokensIn", "tokensOut", "tokensUsed", "costUsd", "relevanceScore", "faithfulnessScore", "helpfulnessScore", success, "errorMessage", "createdAt") FROM stdin;
\.


--
-- Data for Name: PromptTemplate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PromptTemplate" (id, name, description, version, content, variables, "isActive", "promptType", "rolloutStage", "avgLatencyMs", "avgRelevance", "avgFaithfulness", "totalRuns", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TenantPlan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TenantPlan" (id, "userId", "planTier", "monthlyTokenQuota", "monthlyUpgradeQuota", "monthlyEmbeddingQuota", "tokensUsed", "upgradesUsed", "embeddingsUsed", "currentPeriodStart", "currentPeriodEnd", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TenantRole; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TenantRole" (id, "tenantPlanId", "userId", role, permissions, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TokenUsage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TokenUsage" (id, "userId", "conversationId", "messageId", model, "promptTokens", "completionTokens", "totalTokens", cost, "createdAt") FROM stdin;
cmhvl1als0007vp64v03zl2sc	cmhvkqdqp0002vpjommqtow8s	\N	cmhvl1alg0006vp647ovopgsr	gpt-4-0613	16	7	23	0.0009	2025-11-12 05:51:33.616
cmhvl34yg000cvp6431khmwli	cmhvkqdqp0002vpjommqtow8s	\N	cmhvl34xw000bvp6451mqehzz	gpt-4-0613	38	7	45	0.00156	2025-11-12 05:52:59.608
cmhvs1g4d0005vp6c9951v6k6	cmhvr0roi0000vpwozhr5zt0z	\N	cmhvs1g3s0004vp6c0d4nl1un	gpt-4o-mini	10	22	32	0.00162	2025-11-12 09:07:38.077
cmhvs3gku000bvp6cqnuvhqh2	cmhuyfj0t0009vpx8yxzzg8ia	\N	cmhvs3gk6000avp6chw8x4e54	gpt-4o-mini	6	14	20	0.00102	2025-11-12 09:09:11.982
cmhvtmgr1000gvp6cbp7vt4ix	cmhuyfj0t0009vpx8yxzzg8ia	\N	cmhvtmgqn000fvp6c7ghkfdc5	gpt-4o-mini	9	79	88	0.00501	2025-11-12 09:51:58.285
cmhvtn6x2000lvp6cg4pzr9og	cmhuyfj0t0009vpx8yxzzg8ia	\N	cmhvtn6ws000kvp6ciloz2c6i	gpt-4o-mini	174	546	720	0.03798	2025-11-12 09:52:32.198
cmhvzeiko000rvp6c47tw3ddc	cmhvzcect0001vpwo4ocfm99q	\N	cmhvzeikg000qvp6chp9p8e3j	gpt-4o-mini	185	358	543	0.02703	2025-11-12 12:33:45.096
cmhvzgwne000wvp6cmyh99s98	cmhvzcect0001vpwo4ocfm99q	\N	cmhvzgwme000vvp6caux8mbgn	gpt-4o-mini	196	1817	2013	0.1149	2025-11-12 12:35:36.651
cmhvzqcbo0012vp6cedr0n0rf	cmhvzpy4a0002vpwogj14muhv	\N	cmhvzqcbi0011vp6cof6r2uhe	gpt-4o-mini	17	93	110	0.00609	2025-11-12 12:42:56.868
cmhvzr7jt0017vp6c6n1agh11	cmhvzpy4a0002vpwogj14muhv	\N	cmhvzr7jl0016vp6cyw13dll1	gpt-4o-mini	17	112	129	0.007229999999999999	2025-11-12 12:43:37.337
cmhvzuvwh001dvp6c0p5m1dym	cmhuyfj0t0009vpx8yxzzg8ia	\N	cmhvzuvwd001cvp6c0atbqgte	gpt-4o-mini	2	9	11	0.0005999999999999998	2025-11-12 12:46:28.865
cmhvzvm62001ivp6c75s6v2p5	cmhuyfj0t0009vpx8yxzzg8ia	\N	cmhvzvm5q001hvp6cr16pbbq9	gpt-4o-mini	224	376	600	0.02928	2025-11-12 12:47:02.906
cmhvzwlpe001nvp6c88886env	cmhuyfj0t0009vpx8yxzzg8ia	\N	cmhvzwlp6001mvp6cmnow2j6b	gpt-4o-mini	33	330	363	0.02079	2025-11-12 12:47:48.962
cmhvzxsgp001svp6cb84zwixh	cmhuyfj0t0009vpx8yxzzg8ia	\N	cmhvzxsgh001rvp6cgoj2c22u	gpt-4o-mini	36	597	633	0.0369	2025-11-12 12:48:44.377
cmhw04wqz001xvp6cdo7ir0b2	cmhvzpy4a0002vpwogj14muhv	\N	cmhw04wqm001wvp6cwvli5eq8	gpt-4o-mini	12	337	349	0.02058	2025-11-12 12:54:16.524
cmhw0fhs90022vp6c09be2zhi	cmhvzpy4a0002vpwogj14muhv	\N	cmhw0fhs10021vp6cvetaur6a	gpt-4o-mini	13	325	338	0.01989	2025-11-12 13:02:30.345
cmhw87l220027vp6c6dro9lac	cmhuyfj0t0009vpx8yxzzg8ia	\N	cmhw87l1u0026vp6csc3kvsbo	gpt-4o-mini	156	406	562	0.02904	2025-11-12 16:40:18.266
cmhw88zs7002dvp6ca6jo7ucz	cmhuyfj0t0009vpx8yxzzg8ia	\N	cmhw88zrl002cvp6cnliahl63	gpt-4o-mini	2	9	11	0.0005999999999999998	2025-11-12 16:41:24.007
cmhw8a20r002ivp6cbmfuu2z6	cmhuyfj0t0009vpx8yxzzg8ia	\N	cmhw8a205002hvp6crpsxwuu4	gpt-4o-mini	6	11	17	0.00084	2025-11-12 16:42:13.564
cmhw8hjde002nvp6chwiawcrg	cmhuyfj0t0009vpx8yxzzg8ia	\N	cmhw8hjd4002mvp6caimpij57	gpt-4o-mini	2	41	43	0.00252	2025-11-12 16:48:02.643
cmhw8ui64002tvp6coxwvaec4	cmhw8u0t60003vpwosca70x48	\N	cmhw8ui5s002svp6cea1982js	gpt-4o-mini	12	3	15	0.0005399999999999999	2025-11-12 16:58:07.613
cmhw96p83002zvp6cnqytxf5x	cmhn4b0ga0001vp9g3mybffdw	\N	cmhw96p7n002yvp6cy2jp22w0	gpt-4o-mini	2	9	11	0.0005999999999999998	2025-11-12 17:07:36.627
cmhwadf300035vp6cplyamzox	cmhw8u0t60003vpwosca70x48	\N	cmhwadf2m0034vp6ce9k7yizy	gpt-4o-mini	6	10	16	0.0007799999999999999	2025-11-12 17:40:49.692
cmhwbnf1q0005vpr85w7o3k9e	cmhuyfj0t0009vpx8yxzzg8ia	\N	cmhwbnf1c0004vpr8xo2jivft	gpt-4o-mini	4	10	14	0.0007199999999999999	2025-11-12 18:16:35.822
cmhwcosi20004vpi0zv58pihy	cmhuyfj0t0009vpx8yxzzg8ia	\N	cmhwcoshr0003vpi0lumj9ox9	gpt-4o-mini	158	723	881	0.04812	2025-11-12 18:45:39.531
cmhwcwzoh0009vpi046jmlmkv	cmhuyfj0t0009vpx8yxzzg8ia	\N	cmhwcwzoa0008vpi0gjk39kmf	gpt-4o-mini	1	31	32	0.00189	2025-11-12 18:52:02.081
cmhwcy5is000evpi0avbu12to	cmhuyfj0t0009vpx8yxzzg8ia	\N	cmhwcy5ik000dvpi0erdljusw	gpt-4o-mini	3	43	46	0.00267	2025-11-12 18:52:56.309
cmhwdsrfj000jvpi0nbjia0fo	cmhuyfj0t0009vpx8yxzzg8ia	\N	cmhwdsrfb000ivpi0fyerffru	gpt-4o-mini	39	801	840	0.04923	2025-11-12 19:16:44.384
cmhwenp47000ovpi0skdrnfdn	cmhuyfj0t0009vpx8yxzzg8ia	\N	cmhwenp3p000nvpi0t4izuqa9	gpt-4o-mini	54	853	907	0.0528	2025-11-12 19:40:47.719
\.


--
-- Data for Name: UsageMeter; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UsageMeter" (id, "tenantPlanId", component, operation, "tokensIn", "tokensOut", "costUsd", "latencyMs", "cacheHit", metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, "emailLower", username, "passwordHash", name, avatar, "isEmailVerified", "emailVerifiedAt", "planTier", "monthlyTokenUsed", "failedLoginAttempts", "lastFailedLoginAt", "createdAt", "updatedAt", "lastLoginAt") FROM stdin;
cmhvn4p0e0003vpjonh8ildod	gatewaytest@example.com	gatewaytest@example.com	\N	$2b$10$PYM17xbcCxW.Vsnj6DIkleZIHVPfHAqRXpFli9veMRaocBqp5GafK	\N	\N	f	2025-11-12 06:50:11.481	FREE	0	0	\N	2025-11-12 06:50:11.486	2025-11-12 06:50:11.486	\N
cmhvn6duh0004vpjol7efn9mm	finaltest@example.com	finaltest@example.com	\N	$2b$10$pVvejIBfio8.DbzeU2U2I.UKYMHsNKCaE.ZujGhT3Sg9HIgKJoxp6	\N	\N	f	2025-11-12 06:51:30.326	FREE	0	0	\N	2025-11-12 06:51:30.329	2025-11-12 06:51:30.329	\N
cmhvnmbaq0005vpjopdykvt99	gateway-test-fixed@example.com	gateway-test-fixed@example.com	\N	$2b$10$srIrZSY22YYeOtPHST8KyeR/WAWlPTxT1xtpiwkU6QNzGfkz/Lslu	\N	\N	f	2025-11-12 07:03:53.52	FREE	0	0	\N	2025-11-12 07:03:53.521	2025-11-12 07:03:53.521	\N
cmhvpfejp0000vpxok17oyzlc	test123@example.com	test123@example.com	\N	$2b$10$FPKsyF7RwMlTsBvFiXYgjubVFQ5izRMy1MUwH.Hrua6Ty9KxdU8HS	\N	\N	f	2025-11-12 07:54:30.371	FREE	0	0	\N	2025-11-12 07:54:30.372	2025-11-12 07:55:12.235	\N
cmhvpkcni0001vpxo40bd3rmh	tester@example.com	tester@example.com	\N	$2b$10$PiRvkyXjwH4uVN0G64BfH.DoDVZz60DW7g/CHuGZ0ZhW73qiXMMLa	\N	\N	f	2025-11-12 07:58:21.196	FREE	0	0	\N	2025-11-12 07:58:21.199	2025-11-12 07:59:16.51	\N
cmhvr0roi0000vpwozhr5zt0z	testfix@example.com	testfix@example.com	\N	$2b$10$2ON5C8CBpYgXb9X3mvgd/eHrYpFpZnBiGCfidTtj.AUoMkkFeM69.	\N	\N	f	2025-11-12 08:39:06.764	FREE	0	0	\N	2025-11-12 08:39:06.784	2025-11-12 08:39:06.784	\N
cmhvzcect0001vpwo4ocfm99q	testfullflow@example.com	testfullflow@example.com	\N	$2b$10$vbIoPGmLvdjHqNk87.dDxuGXBOpJklP4/2K0/VeX7oG8SJ5SZlEJ2	\N	\N	f	2025-11-12 12:32:06.307	FREE	0	0	\N	2025-11-12 12:32:06.317	2025-11-12 12:32:06.317	\N
cmhvzpy4a0002vpwogj14muhv	debugtest@example.com	debugtest@example.com	\N	$2b$10$9a1X5qeYBL7XhKxqyk25mOhDONEH0zsIixO.q8CZU.Sg9FIOM9DPa	\N	\N	f	2025-11-12 12:42:38.456	FREE	0	0	\N	2025-11-12 12:42:38.459	2025-11-12 12:42:38.459	\N
cmhw8u0t60003vpwosca70x48	testfix2@example.com	testfix2@example.com	\N	$2b$10$RJH/iu.6zLh5AqkK34EHduTs3Lm2.dP2wSRZbxEhL7v4nN32/fZ8i	\N	\N	f	2025-11-12 16:57:45.101	FREE	0	0	\N	2025-11-12 16:57:45.11	2025-11-12 16:57:45.11	\N
\.


--
-- Name: ConversationState ConversationState_pkey; Type: CONSTRAINT; Schema: orchestrator; Owner: postgres
--

ALTER TABLE ONLY orchestrator."ConversationState"
    ADD CONSTRAINT "ConversationState_pkey" PRIMARY KEY (id);


--
-- Name: ConversationSummary ConversationSummary_pkey; Type: CONSTRAINT; Schema: orchestrator; Owner: postgres
--

ALTER TABLE ONLY orchestrator."ConversationSummary"
    ADD CONSTRAINT "ConversationSummary_pkey" PRIMARY KEY (id);


--
-- Name: EvalDataset EvalDataset_pkey; Type: CONSTRAINT; Schema: orchestrator; Owner: postgres
--

ALTER TABLE ONLY orchestrator."EvalDataset"
    ADD CONSTRAINT "EvalDataset_pkey" PRIMARY KEY (id);


--
-- Name: EvalQuestion EvalQuestion_pkey; Type: CONSTRAINT; Schema: orchestrator; Owner: postgres
--

ALTER TABLE ONLY orchestrator."EvalQuestion"
    ADD CONSTRAINT "EvalQuestion_pkey" PRIMARY KEY (id);


--
-- Name: EvalResult EvalResult_pkey; Type: CONSTRAINT; Schema: orchestrator; Owner: postgres
--

ALTER TABLE ONLY orchestrator."EvalResult"
    ADD CONSTRAINT "EvalResult_pkey" PRIMARY KEY (id);


--
-- Name: EvalRun EvalRun_pkey; Type: CONSTRAINT; Schema: orchestrator; Owner: postgres
--

ALTER TABLE ONLY orchestrator."EvalRun"
    ADD CONSTRAINT "EvalRun_pkey" PRIMARY KEY (id);


--
-- Name: KnowledgeBase KnowledgeBase_pkey; Type: CONSTRAINT; Schema: orchestrator; Owner: postgres
--

ALTER TABLE ONLY orchestrator."KnowledgeBase"
    ADD CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY (id);


--
-- Name: PIIRedaction PIIRedaction_pkey; Type: CONSTRAINT; Schema: orchestrator; Owner: postgres
--

ALTER TABLE ONLY orchestrator."PIIRedaction"
    ADD CONSTRAINT "PIIRedaction_pkey" PRIMARY KEY (id);


--
-- Name: PromptRun PromptRun_pkey; Type: CONSTRAINT; Schema: orchestrator; Owner: postgres
--

ALTER TABLE ONLY orchestrator."PromptRun"
    ADD CONSTRAINT "PromptRun_pkey" PRIMARY KEY (id);


--
-- Name: PromptTemplate PromptTemplate_pkey; Type: CONSTRAINT; Schema: orchestrator; Owner: postgres
--

ALTER TABLE ONLY orchestrator."PromptTemplate"
    ADD CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY (id);


--
-- Name: TenantPlan TenantPlan_pkey; Type: CONSTRAINT; Schema: orchestrator; Owner: postgres
--

ALTER TABLE ONLY orchestrator."TenantPlan"
    ADD CONSTRAINT "TenantPlan_pkey" PRIMARY KEY (id);


--
-- Name: TenantRole TenantRole_pkey; Type: CONSTRAINT; Schema: orchestrator; Owner: postgres
--

ALTER TABLE ONLY orchestrator."TenantRole"
    ADD CONSTRAINT "TenantRole_pkey" PRIMARY KEY (id);


--
-- Name: UsageMeter UsageMeter_pkey; Type: CONSTRAINT; Schema: orchestrator; Owner: postgres
--

ALTER TABLE ONLY orchestrator."UsageMeter"
    ADD CONSTRAINT "UsageMeter_pkey" PRIMARY KEY (id);


--
-- Name: ConversationState ConversationState_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ConversationState"
    ADD CONSTRAINT "ConversationState_pkey" PRIMARY KEY (id);


--
-- Name: ConversationSummary ConversationSummary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ConversationSummary"
    ADD CONSTRAINT "ConversationSummary_pkey" PRIMARY KEY (id);


--
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: EmailVerificationToken EmailVerificationToken_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EmailVerificationToken"
    ADD CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY (id);


--
-- Name: EvalDataset EvalDataset_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EvalDataset"
    ADD CONSTRAINT "EvalDataset_pkey" PRIMARY KEY (id);


--
-- Name: EvalQuestion EvalQuestion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EvalQuestion"
    ADD CONSTRAINT "EvalQuestion_pkey" PRIMARY KEY (id);


--
-- Name: EvalResult EvalResult_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EvalResult"
    ADD CONSTRAINT "EvalResult_pkey" PRIMARY KEY (id);


--
-- Name: EvalRun EvalRun_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EvalRun"
    ADD CONSTRAINT "EvalRun_pkey" PRIMARY KEY (id);


--
-- Name: KnowledgeBase KnowledgeBase_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."KnowledgeBase"
    ADD CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: PIIRedaction PIIRedaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PIIRedaction"
    ADD CONSTRAINT "PIIRedaction_pkey" PRIMARY KEY (id);


--
-- Name: PasswordResetToken PasswordResetToken_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY (id);


--
-- Name: PromptRun PromptRun_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PromptRun"
    ADD CONSTRAINT "PromptRun_pkey" PRIMARY KEY (id);


--
-- Name: PromptTemplate PromptTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PromptTemplate"
    ADD CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY (id);


--
-- Name: TenantPlan TenantPlan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TenantPlan"
    ADD CONSTRAINT "TenantPlan_pkey" PRIMARY KEY (id);


--
-- Name: TenantRole TenantRole_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TenantRole"
    ADD CONSTRAINT "TenantRole_pkey" PRIMARY KEY (id);


--
-- Name: TokenUsage TokenUsage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TokenUsage"
    ADD CONSTRAINT "TokenUsage_pkey" PRIMARY KEY (id);


--
-- Name: UsageMeter UsageMeter_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UsageMeter"
    ADD CONSTRAINT "UsageMeter_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: ConversationState_conversationId_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "ConversationState_conversationId_idx" ON orchestrator."ConversationState" USING btree ("conversationId");


--
-- Name: ConversationState_conversationId_key; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE UNIQUE INDEX "ConversationState_conversationId_key" ON orchestrator."ConversationState" USING btree ("conversationId");


--
-- Name: ConversationState_expiresAt_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "ConversationState_expiresAt_idx" ON orchestrator."ConversationState" USING btree ("expiresAt");


--
-- Name: ConversationState_lastActivity_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "ConversationState_lastActivity_idx" ON orchestrator."ConversationState" USING btree ("lastActivity");


--
-- Name: ConversationState_userId_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "ConversationState_userId_idx" ON orchestrator."ConversationState" USING btree ("userId");


--
-- Name: ConversationSummary_conversationId_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "ConversationSummary_conversationId_idx" ON orchestrator."ConversationSummary" USING btree ("conversationId");


--
-- Name: ConversationSummary_conversationId_key; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE UNIQUE INDEX "ConversationSummary_conversationId_key" ON orchestrator."ConversationSummary" USING btree ("conversationId");


--
-- Name: ConversationSummary_expiresAt_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "ConversationSummary_expiresAt_idx" ON orchestrator."ConversationSummary" USING btree ("expiresAt");


--
-- Name: ConversationSummary_pineconeId_key; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE UNIQUE INDEX "ConversationSummary_pineconeId_key" ON orchestrator."ConversationSummary" USING btree ("pineconeId");


--
-- Name: ConversationSummary_userId_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "ConversationSummary_userId_idx" ON orchestrator."ConversationSummary" USING btree ("userId");


--
-- Name: ConversationSummary_userId_lastHitAt_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "ConversationSummary_userId_lastHitAt_idx" ON orchestrator."ConversationSummary" USING btree ("userId", "lastHitAt" DESC);


--
-- Name: EvalDataset_category_isActive_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "EvalDataset_category_isActive_idx" ON orchestrator."EvalDataset" USING btree (category, "isActive");


--
-- Name: EvalQuestion_category_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "EvalQuestion_category_idx" ON orchestrator."EvalQuestion" USING btree (category);


--
-- Name: EvalQuestion_evalDatasetId_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "EvalQuestion_evalDatasetId_idx" ON orchestrator."EvalQuestion" USING btree ("evalDatasetId");


--
-- Name: EvalResult_evalQuestionId_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "EvalResult_evalQuestionId_idx" ON orchestrator."EvalResult" USING btree ("evalQuestionId");


--
-- Name: EvalResult_evalRunId_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "EvalResult_evalRunId_idx" ON orchestrator."EvalResult" USING btree ("evalRunId");


--
-- Name: EvalResult_injectionDetected_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "EvalResult_injectionDetected_idx" ON orchestrator."EvalResult" USING btree ("injectionDetected");


--
-- Name: EvalResult_passed_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "EvalResult_passed_idx" ON orchestrator."EvalResult" USING btree (passed);


--
-- Name: EvalResult_piiLeakDetected_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "EvalResult_piiLeakDetected_idx" ON orchestrator."EvalResult" USING btree ("piiLeakDetected");


--
-- Name: EvalRun_evalDatasetId_createdAt_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "EvalRun_evalDatasetId_createdAt_idx" ON orchestrator."EvalRun" USING btree ("evalDatasetId", "createdAt" DESC);


--
-- Name: EvalRun_runType_createdAt_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "EvalRun_runType_createdAt_idx" ON orchestrator."EvalRun" USING btree ("runType", "createdAt" DESC);


--
-- Name: EvalRun_status_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "EvalRun_status_idx" ON orchestrator."EvalRun" USING btree (status);


--
-- Name: KnowledgeBase_category_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "KnowledgeBase_category_idx" ON orchestrator."KnowledgeBase" USING btree (category);


--
-- Name: KnowledgeBase_pineconeId_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "KnowledgeBase_pineconeId_idx" ON orchestrator."KnowledgeBase" USING btree ("pineconeId");


--
-- Name: KnowledgeBase_pineconeId_key; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE UNIQUE INDEX "KnowledgeBase_pineconeId_key" ON orchestrator."KnowledgeBase" USING btree ("pineconeId");


--
-- Name: KnowledgeBase_userId_createdAt_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "KnowledgeBase_userId_createdAt_idx" ON orchestrator."KnowledgeBase" USING btree ("userId", "createdAt" DESC);


--
-- Name: KnowledgeBase_userId_retrievalCount_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "KnowledgeBase_userId_retrievalCount_idx" ON orchestrator."KnowledgeBase" USING btree ("userId", "retrievalCount" DESC);


--
-- Name: PIIRedaction_expiresAt_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "PIIRedaction_expiresAt_idx" ON orchestrator."PIIRedaction" USING btree ("expiresAt");


--
-- Name: PIIRedaction_requestId_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "PIIRedaction_requestId_idx" ON orchestrator."PIIRedaction" USING btree ("requestId");


--
-- Name: PIIRedaction_userId_createdAt_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "PIIRedaction_userId_createdAt_idx" ON orchestrator."PIIRedaction" USING btree ("userId", "createdAt" DESC);


--
-- Name: PromptRun_createdAt_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "PromptRun_createdAt_idx" ON orchestrator."PromptRun" USING btree ("createdAt" DESC);


--
-- Name: PromptRun_promptTemplateId_createdAt_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "PromptRun_promptTemplateId_createdAt_idx" ON orchestrator."PromptRun" USING btree ("promptTemplateId", "createdAt" DESC);


--
-- Name: PromptRun_rolloutStage_success_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "PromptRun_rolloutStage_success_idx" ON orchestrator."PromptRun" USING btree ("rolloutStage", success);


--
-- Name: PromptRun_userId_createdAt_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "PromptRun_userId_createdAt_idx" ON orchestrator."PromptRun" USING btree ("userId", "createdAt" DESC);


--
-- Name: PromptTemplate_name_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "PromptTemplate_name_idx" ON orchestrator."PromptTemplate" USING btree (name);


--
-- Name: PromptTemplate_name_version_key; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE UNIQUE INDEX "PromptTemplate_name_version_key" ON orchestrator."PromptTemplate" USING btree (name, version);


--
-- Name: PromptTemplate_promptType_isActive_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "PromptTemplate_promptType_isActive_idx" ON orchestrator."PromptTemplate" USING btree ("promptType", "isActive");


--
-- Name: TenantPlan_currentPeriodEnd_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "TenantPlan_currentPeriodEnd_idx" ON orchestrator."TenantPlan" USING btree ("currentPeriodEnd");


--
-- Name: TenantPlan_planTier_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "TenantPlan_planTier_idx" ON orchestrator."TenantPlan" USING btree ("planTier");


--
-- Name: TenantPlan_userId_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "TenantPlan_userId_idx" ON orchestrator."TenantPlan" USING btree ("userId");


--
-- Name: TenantPlan_userId_key; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE UNIQUE INDEX "TenantPlan_userId_key" ON orchestrator."TenantPlan" USING btree ("userId");


--
-- Name: TenantRole_tenantPlanId_role_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "TenantRole_tenantPlanId_role_idx" ON orchestrator."TenantRole" USING btree ("tenantPlanId", role);


--
-- Name: TenantRole_tenantPlanId_userId_key; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE UNIQUE INDEX "TenantRole_tenantPlanId_userId_key" ON orchestrator."TenantRole" USING btree ("tenantPlanId", "userId");


--
-- Name: TenantRole_userId_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "TenantRole_userId_idx" ON orchestrator."TenantRole" USING btree ("userId");


--
-- Name: UsageMeter_cacheHit_component_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "UsageMeter_cacheHit_component_idx" ON orchestrator."UsageMeter" USING btree ("cacheHit", component);


--
-- Name: UsageMeter_component_createdAt_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "UsageMeter_component_createdAt_idx" ON orchestrator."UsageMeter" USING btree (component, "createdAt" DESC);


--
-- Name: UsageMeter_tenantPlanId_createdAt_idx; Type: INDEX; Schema: orchestrator; Owner: postgres
--

CREATE INDEX "UsageMeter_tenantPlanId_createdAt_idx" ON orchestrator."UsageMeter" USING btree ("tenantPlanId", "createdAt" DESC);


--
-- Name: ConversationState_conversationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ConversationState_conversationId_idx" ON public."ConversationState" USING btree ("conversationId");


--
-- Name: ConversationState_conversationId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ConversationState_conversationId_key" ON public."ConversationState" USING btree ("conversationId");


--
-- Name: ConversationState_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ConversationState_expiresAt_idx" ON public."ConversationState" USING btree ("expiresAt");


--
-- Name: ConversationState_lastActivity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ConversationState_lastActivity_idx" ON public."ConversationState" USING btree ("lastActivity");


--
-- Name: ConversationState_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ConversationState_userId_idx" ON public."ConversationState" USING btree ("userId");


--
-- Name: ConversationSummary_conversationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ConversationSummary_conversationId_idx" ON public."ConversationSummary" USING btree ("conversationId");


--
-- Name: ConversationSummary_conversationId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ConversationSummary_conversationId_key" ON public."ConversationSummary" USING btree ("conversationId");


--
-- Name: ConversationSummary_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ConversationSummary_expiresAt_idx" ON public."ConversationSummary" USING btree ("expiresAt");


--
-- Name: ConversationSummary_pineconeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ConversationSummary_pineconeId_key" ON public."ConversationSummary" USING btree ("pineconeId");


--
-- Name: ConversationSummary_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ConversationSummary_userId_idx" ON public."ConversationSummary" USING btree ("userId");


--
-- Name: ConversationSummary_userId_lastHitAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ConversationSummary_userId_lastHitAt_idx" ON public."ConversationSummary" USING btree ("userId", "lastHitAt" DESC);


--
-- Name: Conversation_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Conversation_deletedAt_idx" ON public."Conversation" USING btree ("deletedAt");


--
-- Name: Conversation_userId_pinned_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Conversation_userId_pinned_idx" ON public."Conversation" USING btree ("userId", pinned);


--
-- Name: Conversation_userId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Conversation_userId_status_idx" ON public."Conversation" USING btree ("userId", status);


--
-- Name: Conversation_userId_updatedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Conversation_userId_updatedAt_idx" ON public."Conversation" USING btree ("userId", "updatedAt" DESC);


--
-- Name: EmailVerificationToken_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON public."EmailVerificationToken" USING btree ("expiresAt");


--
-- Name: EmailVerificationToken_tokenHash_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON public."EmailVerificationToken" USING btree ("tokenHash");


--
-- Name: EmailVerificationToken_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EmailVerificationToken_userId_idx" ON public."EmailVerificationToken" USING btree ("userId");


--
-- Name: EvalDataset_category_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EvalDataset_category_isActive_idx" ON public."EvalDataset" USING btree (category, "isActive");


--
-- Name: EvalQuestion_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EvalQuestion_category_idx" ON public."EvalQuestion" USING btree (category);


--
-- Name: EvalQuestion_evalDatasetId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EvalQuestion_evalDatasetId_idx" ON public."EvalQuestion" USING btree ("evalDatasetId");


--
-- Name: EvalResult_evalQuestionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EvalResult_evalQuestionId_idx" ON public."EvalResult" USING btree ("evalQuestionId");


--
-- Name: EvalResult_evalRunId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EvalResult_evalRunId_idx" ON public."EvalResult" USING btree ("evalRunId");


--
-- Name: EvalResult_injectionDetected_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EvalResult_injectionDetected_idx" ON public."EvalResult" USING btree ("injectionDetected");


--
-- Name: EvalResult_passed_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EvalResult_passed_idx" ON public."EvalResult" USING btree (passed);


--
-- Name: EvalResult_piiLeakDetected_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EvalResult_piiLeakDetected_idx" ON public."EvalResult" USING btree ("piiLeakDetected");


--
-- Name: EvalRun_evalDatasetId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EvalRun_evalDatasetId_createdAt_idx" ON public."EvalRun" USING btree ("evalDatasetId", "createdAt" DESC);


--
-- Name: EvalRun_runType_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EvalRun_runType_createdAt_idx" ON public."EvalRun" USING btree ("runType", "createdAt" DESC);


--
-- Name: EvalRun_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EvalRun_status_idx" ON public."EvalRun" USING btree (status);


--
-- Name: KnowledgeBase_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "KnowledgeBase_category_idx" ON public."KnowledgeBase" USING btree (category);


--
-- Name: KnowledgeBase_pineconeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "KnowledgeBase_pineconeId_idx" ON public."KnowledgeBase" USING btree ("pineconeId");


--
-- Name: KnowledgeBase_pineconeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "KnowledgeBase_pineconeId_key" ON public."KnowledgeBase" USING btree ("pineconeId");


--
-- Name: KnowledgeBase_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "KnowledgeBase_userId_createdAt_idx" ON public."KnowledgeBase" USING btree ("userId", "createdAt" DESC);


--
-- Name: KnowledgeBase_userId_retrievalCount_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "KnowledgeBase_userId_retrievalCount_idx" ON public."KnowledgeBase" USING btree ("userId", "retrievalCount" DESC);


--
-- Name: Message_conversationId_contentType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_conversationId_contentType_idx" ON public."Message" USING btree ("conversationId", "contentType");


--
-- Name: Message_conversationId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_conversationId_createdAt_idx" ON public."Message" USING btree ("conversationId", "createdAt");


--
-- Name: Message_conversationId_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_conversationId_role_idx" ON public."Message" USING btree ("conversationId", role);


--
-- Name: Message_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_deletedAt_idx" ON public."Message" USING btree ("deletedAt");


--
-- Name: PIIRedaction_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PIIRedaction_expiresAt_idx" ON public."PIIRedaction" USING btree ("expiresAt");


--
-- Name: PIIRedaction_requestId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PIIRedaction_requestId_idx" ON public."PIIRedaction" USING btree ("requestId");


--
-- Name: PIIRedaction_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PIIRedaction_userId_createdAt_idx" ON public."PIIRedaction" USING btree ("userId", "createdAt" DESC);


--
-- Name: PasswordResetToken_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PasswordResetToken_expiresAt_idx" ON public."PasswordResetToken" USING btree ("expiresAt");


--
-- Name: PasswordResetToken_tokenHash_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON public."PasswordResetToken" USING btree ("tokenHash");


--
-- Name: PasswordResetToken_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PasswordResetToken_userId_idx" ON public."PasswordResetToken" USING btree ("userId");


--
-- Name: PromptRun_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PromptRun_createdAt_idx" ON public."PromptRun" USING btree ("createdAt" DESC);


--
-- Name: PromptRun_promptTemplateId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PromptRun_promptTemplateId_createdAt_idx" ON public."PromptRun" USING btree ("promptTemplateId", "createdAt" DESC);


--
-- Name: PromptRun_rolloutStage_success_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PromptRun_rolloutStage_success_idx" ON public."PromptRun" USING btree ("rolloutStage", success);


--
-- Name: PromptRun_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PromptRun_userId_createdAt_idx" ON public."PromptRun" USING btree ("userId", "createdAt" DESC);


--
-- Name: PromptTemplate_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PromptTemplate_name_idx" ON public."PromptTemplate" USING btree (name);


--
-- Name: PromptTemplate_name_version_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PromptTemplate_name_version_key" ON public."PromptTemplate" USING btree (name, version);


--
-- Name: PromptTemplate_promptType_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PromptTemplate_promptType_isActive_idx" ON public."PromptTemplate" USING btree ("promptType", "isActive");


--
-- Name: TenantPlan_currentPeriodEnd_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TenantPlan_currentPeriodEnd_idx" ON public."TenantPlan" USING btree ("currentPeriodEnd");


--
-- Name: TenantPlan_planTier_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TenantPlan_planTier_idx" ON public."TenantPlan" USING btree ("planTier");


--
-- Name: TenantPlan_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TenantPlan_userId_idx" ON public."TenantPlan" USING btree ("userId");


--
-- Name: TenantPlan_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TenantPlan_userId_key" ON public."TenantPlan" USING btree ("userId");


--
-- Name: TenantRole_tenantPlanId_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TenantRole_tenantPlanId_role_idx" ON public."TenantRole" USING btree ("tenantPlanId", role);


--
-- Name: TenantRole_tenantPlanId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TenantRole_tenantPlanId_userId_key" ON public."TenantRole" USING btree ("tenantPlanId", "userId");


--
-- Name: TenantRole_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TenantRole_userId_idx" ON public."TenantRole" USING btree ("userId");


--
-- Name: TokenUsage_conversationId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TokenUsage_conversationId_createdAt_idx" ON public."TokenUsage" USING btree ("conversationId", "createdAt");


--
-- Name: TokenUsage_conversationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TokenUsage_conversationId_idx" ON public."TokenUsage" USING btree ("conversationId");


--
-- Name: TokenUsage_messageId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TokenUsage_messageId_idx" ON public."TokenUsage" USING btree ("messageId");


--
-- Name: TokenUsage_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TokenUsage_userId_createdAt_idx" ON public."TokenUsage" USING btree ("userId", "createdAt" DESC);


--
-- Name: UsageMeter_cacheHit_component_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UsageMeter_cacheHit_component_idx" ON public."UsageMeter" USING btree ("cacheHit", component);


--
-- Name: UsageMeter_component_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UsageMeter_component_createdAt_idx" ON public."UsageMeter" USING btree (component, "createdAt" DESC);


--
-- Name: UsageMeter_tenantPlanId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UsageMeter_tenantPlanId_createdAt_idx" ON public."UsageMeter" USING btree ("tenantPlanId", "createdAt" DESC);


--
-- Name: User_emailLower_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_emailLower_idx" ON public."User" USING btree ("emailLower");


--
-- Name: User_emailLower_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_emailLower_key" ON public."User" USING btree ("emailLower");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_username_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_username_idx" ON public."User" USING btree (username);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: EvalQuestion EvalQuestion_evalDatasetId_fkey; Type: FK CONSTRAINT; Schema: orchestrator; Owner: postgres
--

ALTER TABLE ONLY orchestrator."EvalQuestion"
    ADD CONSTRAINT "EvalQuestion_evalDatasetId_fkey" FOREIGN KEY ("evalDatasetId") REFERENCES orchestrator."EvalDataset"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EvalResult EvalResult_evalQuestionId_fkey; Type: FK CONSTRAINT; Schema: orchestrator; Owner: postgres
--

ALTER TABLE ONLY orchestrator."EvalResult"
    ADD CONSTRAINT "EvalResult_evalQuestionId_fkey" FOREIGN KEY ("evalQuestionId") REFERENCES orchestrator."EvalQuestion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EvalResult EvalResult_evalRunId_fkey; Type: FK CONSTRAINT; Schema: orchestrator; Owner: postgres
--

ALTER TABLE ONLY orchestrator."EvalResult"
    ADD CONSTRAINT "EvalResult_evalRunId_fkey" FOREIGN KEY ("evalRunId") REFERENCES orchestrator."EvalRun"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EvalRun EvalRun_evalDatasetId_fkey; Type: FK CONSTRAINT; Schema: orchestrator; Owner: postgres
--

ALTER TABLE ONLY orchestrator."EvalRun"
    ADD CONSTRAINT "EvalRun_evalDatasetId_fkey" FOREIGN KEY ("evalDatasetId") REFERENCES orchestrator."EvalDataset"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PromptRun PromptRun_promptTemplateId_fkey; Type: FK CONSTRAINT; Schema: orchestrator; Owner: postgres
--

ALTER TABLE ONLY orchestrator."PromptRun"
    ADD CONSTRAINT "PromptRun_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES orchestrator."PromptTemplate"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TenantRole TenantRole_tenantPlanId_fkey; Type: FK CONSTRAINT; Schema: orchestrator; Owner: postgres
--

ALTER TABLE ONLY orchestrator."TenantRole"
    ADD CONSTRAINT "TenantRole_tenantPlanId_fkey" FOREIGN KEY ("tenantPlanId") REFERENCES orchestrator."TenantPlan"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UsageMeter UsageMeter_tenantPlanId_fkey; Type: FK CONSTRAINT; Schema: orchestrator; Owner: postgres
--

ALTER TABLE ONLY orchestrator."UsageMeter"
    ADD CONSTRAINT "UsageMeter_tenantPlanId_fkey" FOREIGN KEY ("tenantPlanId") REFERENCES orchestrator."TenantPlan"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EmailVerificationToken EmailVerificationToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EmailVerificationToken"
    ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EvalQuestion EvalQuestion_evalDatasetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EvalQuestion"
    ADD CONSTRAINT "EvalQuestion_evalDatasetId_fkey" FOREIGN KEY ("evalDatasetId") REFERENCES public."EvalDataset"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EvalResult EvalResult_evalQuestionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EvalResult"
    ADD CONSTRAINT "EvalResult_evalQuestionId_fkey" FOREIGN KEY ("evalQuestionId") REFERENCES public."EvalQuestion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EvalResult EvalResult_evalRunId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EvalResult"
    ADD CONSTRAINT "EvalResult_evalRunId_fkey" FOREIGN KEY ("evalRunId") REFERENCES public."EvalRun"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EvalRun EvalRun_evalDatasetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EvalRun"
    ADD CONSTRAINT "EvalRun_evalDatasetId_fkey" FOREIGN KEY ("evalDatasetId") REFERENCES public."EvalDataset"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PasswordResetToken PasswordResetToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PromptRun PromptRun_promptTemplateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PromptRun"
    ADD CONSTRAINT "PromptRun_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES public."PromptTemplate"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TenantRole TenantRole_tenantPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TenantRole"
    ADD CONSTRAINT "TenantRole_tenantPlanId_fkey" FOREIGN KEY ("tenantPlanId") REFERENCES public."TenantPlan"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UsageMeter UsageMeter_tenantPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UsageMeter"
    ADD CONSTRAINT "UsageMeter_tenantPlanId_fkey" FOREIGN KEY ("tenantPlanId") REFERENCES public."TenantPlan"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict BZQlxHfUg5Usm35cIvZ1sYITiFCh4ImiSDbgwiUSQeqyyvg6q8PCuNghGTIxVYf

