--
-- PostgreSQL database dump
--

\restrict bD3dwQ0rOa7X5nAcyLnvtSU30eB7cABcHPgnn5LYC0DMaVWFZHKS2uvyNymAhzM

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

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
-- Name: applicationstatus; Type: TYPE; Schema: public; Owner: finos
--

CREATE TYPE public.applicationstatus AS ENUM (
    'draft',
    'submitted',
    'review',
    'eligibility-check',
    'credit-assessment',
    'offer-issued',
    'accepted',
    'disbursed',
    'underwriting',
    'quoted',
    'policy-issued',
    'identity-check',
    'approved',
    'card-issued',
    'kyc-validation',
    'compliance-screening',
    'account-created',
    'activated',
    'additional-info',
    'rejected'
);


ALTER TYPE public.applicationstatus OWNER TO finos;

--
-- Name: documentstatus; Type: TYPE; Schema: public; Owner: finos
--

CREATE TYPE public.documentstatus AS ENUM (
    'required',
    'uploaded',
    'verified',
    'rejected'
);


ALTER TYPE public.documentstatus OWNER TO finos;

--
-- Name: lifecyclestage; Type: TYPE; Schema: public; Owner: finos
--

CREATE TYPE public.lifecyclestage AS ENUM (
    'lead',
    'applicant',
    'customer'
);


ALTER TYPE public.lifecyclestage OWNER TO finos;

--
-- Name: requestkind; Type: TYPE; Schema: public; Owner: finos
--

CREATE TYPE public.requestkind AS ENUM (
    'document',
    'text'
);


ALTER TYPE public.requestkind OWNER TO finos;

--
-- Name: requeststatus; Type: TYPE; Schema: public; Owner: finos
--

CREATE TYPE public.requeststatus AS ENUM (
    'open',
    'submitted',
    'resolved',
    'cancelled'
);


ALTER TYPE public.requeststatus OWNER TO finos;

--
-- Name: userrole; Type: TYPE; Schema: public; Owner: finos
--

CREATE TYPE public.userrole AS ENUM (
    'client',
    'operations_agent',
    'operations_manager',
    'claims_agent',
    'underwriter',
    'compliance',
    'administrator'
);


ALTER TYPE public.userrole OWNER TO finos;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: finos
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO finos;

--
-- Name: applications; Type: TABLE; Schema: public; Owner: finos
--

CREATE TABLE public.applications (
    id character varying NOT NULL,
    client_id character varying,
    product_type character varying NOT NULL,
    product_label character varying NOT NULL,
    department character varying,
    steps json DEFAULT '[]'::json,
    step_index integer DEFAULT 0,
    current_step character varying NOT NULL,
    amount numeric(18,2) NOT NULL,
    currency character varying DEFAULT 'PKR'::character varying,
    status character varying DEFAULT 'in-progress'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    timeline json DEFAULT '[]'::json,
    decision_reason_code character varying,
    decision_notes character varying,
    decided_at timestamp with time zone,
    decided_by_user_id character varying,
    unified_data jsonb,
    unified_schema_version character varying(20)
);


ALTER TABLE public.applications OWNER TO finos;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: finos
--

CREATE TABLE public.audit_logs (
    id character varying NOT NULL,
    "time" timestamp with time zone DEFAULT now(),
    actor_user_id character varying,
    client_id character varying,
    subject_type character varying,
    subject_id character varying,
    event character varying NOT NULL,
    details character varying NOT NULL,
    department character varying,
    request_id character varying,
    ip_address character varying,
    extra_data json DEFAULT '{}'::json
);


ALTER TABLE public.audit_logs OWNER TO finos;

--
-- Name: claims; Type: TABLE; Schema: public; Owner: finos
--

CREATE TABLE public.claims (
    id character varying NOT NULL,
    client_id character varying,
    product_type character varying NOT NULL,
    product_label character varying NOT NULL,
    policy_id character varying,
    type character varying NOT NULL,
    amount numeric(18,2) NOT NULL,
    currency character varying DEFAULT 'PKR'::character varying,
    current_step character varying NOT NULL,
    step_index integer DEFAULT 0,
    steps json DEFAULT '[]'::json,
    outcome character varying,
    incident_date timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    description character varying NOT NULL,
    severity character varying DEFAULT 'Standard'::character varying,
    reserve_amount numeric(18,2) DEFAULT '0'::double precision,
    approved_amount numeric(18,2) DEFAULT '0'::double precision,
    excess numeric(18,2) DEFAULT '0'::double precision,
    fraud_indicator boolean DEFAULT false,
    payment_ref character varying,
    insurer_ref character varying,
    timeline json DEFAULT '[]'::json,
    resolution_reason_code character varying,
    resolution_notes character varying,
    resolved_at timestamp with time zone,
    resolved_by_user_id character varying
);


ALTER TABLE public.claims OWNER TO finos;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: finos
--

CREATE TABLE public.clients (
    id character varying NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    phone character varying,
    lifecycle_stage public.lifecyclestage DEFAULT 'lead'::public.lifecyclestage NOT NULL,
    has_open_claim boolean DEFAULT false,
    assigned_department character varying,
    created_at timestamp with time zone DEFAULT now(),
    last_activity timestamp with time zone DEFAULT now(),
    engagement_score integer DEFAULT 50
);


ALTER TABLE public.clients OWNER TO finos;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: finos
--

CREATE TABLE public.documents (
    id character varying NOT NULL,
    client_id character varying NOT NULL,
    type character varying NOT NULL,
    name character varying NOT NULL,
    ref_id character varying,
    ref_type character varying,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    file_url character varying,
    mime_type character varying,
    size_bytes integer,
    checksum character varying,
    storage_key character varying,
    uploaded_by_user character varying,
    original_filename character varying NOT NULL
);


ALTER TABLE public.documents OWNER TO finos;

--
-- Name: front_products; Type: TABLE; Schema: public; Owner: finos
--

CREATE TABLE public.front_products (
    product_id character varying NOT NULL,
    provider_id character varying,
    product_type character varying,
    jurisdiction jsonb,
    status character varying,
    version character varying,
    last_updated timestamp with time zone,
    pricing jsonb,
    eligibility_rules jsonb,
    features jsonb,
    compliance jsonb,
    schema_hash character varying,
    effective_date character varying,
    published_by character varying,
    approved_by character varying,
    change_request character varying,
    previous_version character varying
);


ALTER TABLE public.front_products OWNER TO finos;

--
-- Name: fv_audit_logs; Type: TABLE; Schema: public; Owner: finos
--

CREATE TABLE public.fv_audit_logs (
    id integer NOT NULL,
    application_id character varying(32),
    user_id character varying(36) NOT NULL,
    action character varying(100) NOT NULL,
    details json NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fv_audit_logs OWNER TO finos;

--
-- Name: fv_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: finos
--

CREATE SEQUENCE public.fv_audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.fv_audit_logs_id_seq OWNER TO finos;

--
-- Name: fv_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: finos
--

ALTER SEQUENCE public.fv_audit_logs_id_seq OWNED BY public.fv_audit_logs.id;


--
-- Name: fv_communications; Type: TABLE; Schema: public; Owner: finos
--

CREATE TABLE public.fv_communications (
    id integer NOT NULL,
    application_id character varying(32) NOT NULL,
    sender_id character varying(36) NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fv_communications OWNER TO finos;

--
-- Name: fv_communications_id_seq; Type: SEQUENCE; Schema: public; Owner: finos
--

CREATE SEQUENCE public.fv_communications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.fv_communications_id_seq OWNER TO finos;

--
-- Name: fv_communications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: finos
--

ALTER SEQUENCE public.fv_communications_id_seq OWNED BY public.fv_communications.id;


--
-- Name: fv_documents; Type: TABLE; Schema: public; Owner: finos
--

CREATE TABLE public.fv_documents (
    id integer NOT NULL,
    application_id character varying(32) NOT NULL,
    requirement_code character varying(80) NOT NULL,
    display_name character varying(180) NOT NULL,
    status character varying(50) NOT NULL,
    original_name character varying(255),
    stored_name character varying(255),
    mime_type character varying(120),
    file_size integer,
    sha256 character varying(64),
    uploaded_by_id character varying(36),
    uploaded_at timestamp with time zone
);


ALTER TABLE public.fv_documents OWNER TO finos;

--
-- Name: fv_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: finos
--

CREATE SEQUENCE public.fv_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.fv_documents_id_seq OWNER TO finos;

--
-- Name: fv_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: finos
--

ALTER SEQUENCE public.fv_documents_id_seq OWNED BY public.fv_documents.id;


--
-- Name: fv_information_requests; Type: TABLE; Schema: public; Owner: finos
--

CREATE TABLE public.fv_information_requests (
    id integer NOT NULL,
    public_id character varying(32) NOT NULL,
    application_id character varying(32) NOT NULL,
    kind character varying(50) NOT NULL,
    label character varying(255) NOT NULL,
    document_requirement_code character varying(80),
    response_text text,
    status character varying(50) NOT NULL,
    requested_by_id character varying(36) NOT NULL,
    resolved_by_id character varying(36),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    submitted_at timestamp with time zone,
    resolved_at timestamp with time zone
);


ALTER TABLE public.fv_information_requests OWNER TO finos;

--
-- Name: fv_information_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: finos
--

CREATE SEQUENCE public.fv_information_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.fv_information_requests_id_seq OWNER TO finos;

--
-- Name: fv_information_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: finos
--

ALTER SEQUENCE public.fv_information_requests_id_seq OWNED BY public.fv_information_requests.id;


--
-- Name: fv_status_events; Type: TABLE; Schema: public; Owner: finos
--

CREATE TABLE public.fv_status_events (
    id integer NOT NULL,
    application_id character varying(32) NOT NULL,
    from_status character varying(50),
    to_status character varying(50) NOT NULL,
    changed_by_id character varying(36) NOT NULL,
    reason character varying(500),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fv_status_events OWNER TO finos;

--
-- Name: fv_status_events_id_seq; Type: SEQUENCE; Schema: public; Owner: finos
--

CREATE SEQUENCE public.fv_status_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.fv_status_events_id_seq OWNER TO finos;

--
-- Name: fv_status_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: finos
--

ALTER SEQUENCE public.fv_status_events_id_seq OWNED BY public.fv_status_events.id;


--
-- Name: fv_users; Type: TABLE; Schema: public; Owner: finos
--

CREATE TABLE public.fv_users (
    id character varying(36) NOT NULL,
    public_id character varying(32) NOT NULL,
    name character varying(120) NOT NULL,
    cnic character varying(15),
    username character varying(80) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fv_users OWNER TO finos;

--
-- Name: holdings; Type: TABLE; Schema: public; Owner: finos
--

CREATE TABLE public.holdings (
    id character varying NOT NULL,
    client_id character varying,
    application_id character varying,
    product_type character varying NOT NULL,
    product_label character varying NOT NULL,
    holding_type character varying NOT NULL,
    status character varying DEFAULT 'active'::character varying,
    opened_at timestamp with time zone DEFAULT now(),
    details json DEFAULT '{}'::json
);


ALTER TABLE public.holdings OWNER TO finos;

--
-- Name: message_receipts; Type: TABLE; Schema: public; Owner: finos
--

CREATE TABLE public.message_receipts (
    id integer NOT NULL,
    message_id integer NOT NULL,
    user_id character varying(36) NOT NULL,
    read_at timestamp with time zone
);


ALTER TABLE public.message_receipts OWNER TO finos;

--
-- Name: message_receipts_id_seq; Type: SEQUENCE; Schema: public; Owner: finos
--

CREATE SEQUENCE public.message_receipts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.message_receipts_id_seq OWNER TO finos;

--
-- Name: message_receipts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: finos
--

ALTER SEQUENCE public.message_receipts_id_seq OWNED BY public.message_receipts.id;


--
-- Name: policies; Type: TABLE; Schema: public; Owner: finos
--

CREATE TABLE public.policies (
    id character varying NOT NULL,
    client_id character varying,
    product_type character varying NOT NULL,
    product_label character varying NOT NULL,
    application_id character varying,
    policy_number character varying NOT NULL,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    premium numeric(18,2),
    sum_assured numeric(18,2),
    status character varying DEFAULT 'active'::character varying,
    details json DEFAULT '{}'::json,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.policies OWNER TO finos;

--
-- Name: users; Type: TABLE; Schema: public; Owner: finos
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    email character varying NOT NULL,
    hashed_password character varying NOT NULL,
    full_name character varying NOT NULL,
    role public.userrole NOT NULL,
    client_id character varying,
    is_active boolean DEFAULT true
);


ALTER TABLE public.users OWNER TO finos;

--
-- Name: fv_audit_logs id; Type: DEFAULT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.fv_audit_logs_id_seq'::regclass);


--
-- Name: fv_communications id; Type: DEFAULT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_communications ALTER COLUMN id SET DEFAULT nextval('public.fv_communications_id_seq'::regclass);


--
-- Name: fv_documents id; Type: DEFAULT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_documents ALTER COLUMN id SET DEFAULT nextval('public.fv_documents_id_seq'::regclass);


--
-- Name: fv_information_requests id; Type: DEFAULT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_information_requests ALTER COLUMN id SET DEFAULT nextval('public.fv_information_requests_id_seq'::regclass);


--
-- Name: fv_status_events id; Type: DEFAULT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_status_events ALTER COLUMN id SET DEFAULT nextval('public.fv_status_events_id_seq'::regclass);


--
-- Name: message_receipts id; Type: DEFAULT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.message_receipts ALTER COLUMN id SET DEFAULT nextval('public.message_receipts_id_seq'::regclass);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: claims claims_pkey; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_pkey PRIMARY KEY (id);


--
-- Name: clients clients_email_key; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_email_key UNIQUE (email);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: front_products front_products_pkey; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.front_products
    ADD CONSTRAINT front_products_pkey PRIMARY KEY (product_id);


--
-- Name: fv_audit_logs fv_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_audit_logs
    ADD CONSTRAINT fv_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: fv_communications fv_communications_pkey; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_communications
    ADD CONSTRAINT fv_communications_pkey PRIMARY KEY (id);


--
-- Name: fv_documents fv_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_documents
    ADD CONSTRAINT fv_documents_pkey PRIMARY KEY (id);


--
-- Name: fv_documents fv_documents_stored_name_key; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_documents
    ADD CONSTRAINT fv_documents_stored_name_key UNIQUE (stored_name);


--
-- Name: fv_information_requests fv_information_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_information_requests
    ADD CONSTRAINT fv_information_requests_pkey PRIMARY KEY (id);


--
-- Name: fv_status_events fv_status_events_pkey; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_status_events
    ADD CONSTRAINT fv_status_events_pkey PRIMARY KEY (id);


--
-- Name: fv_users fv_users_cnic_key; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_users
    ADD CONSTRAINT fv_users_cnic_key UNIQUE (cnic);


--
-- Name: fv_users fv_users_pkey; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_users
    ADD CONSTRAINT fv_users_pkey PRIMARY KEY (id);


--
-- Name: holdings holdings_application_id_key; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.holdings
    ADD CONSTRAINT holdings_application_id_key UNIQUE (application_id);


--
-- Name: holdings holdings_pkey; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.holdings
    ADD CONSTRAINT holdings_pkey PRIMARY KEY (id);


--
-- Name: message_receipts message_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.message_receipts
    ADD CONSTRAINT message_receipts_pkey PRIMARY KEY (id);


--
-- Name: policies policies_application_id_key; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_application_id_key UNIQUE (application_id);


--
-- Name: policies policies_pkey; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_pkey PRIMARY KEY (id);


--
-- Name: policies policies_policy_number_key; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_policy_number_key UNIQUE (policy_number);


--
-- Name: fv_documents uq_app_doc_req; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_documents
    ADD CONSTRAINT uq_app_doc_req UNIQUE (application_id, requirement_code);


--
-- Name: message_receipts uq_message_user; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.message_receipts
    ADD CONSTRAINT uq_message_user UNIQUE (message_id, user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_fv_audit_logs_application_id; Type: INDEX; Schema: public; Owner: finos
--

CREATE INDEX ix_fv_audit_logs_application_id ON public.fv_audit_logs USING btree (application_id);


--
-- Name: ix_fv_communications_application_id; Type: INDEX; Schema: public; Owner: finos
--

CREATE INDEX ix_fv_communications_application_id ON public.fv_communications USING btree (application_id);


--
-- Name: ix_fv_documents_application_id; Type: INDEX; Schema: public; Owner: finos
--

CREATE INDEX ix_fv_documents_application_id ON public.fv_documents USING btree (application_id);


--
-- Name: ix_fv_information_requests_application_id; Type: INDEX; Schema: public; Owner: finos
--

CREATE INDEX ix_fv_information_requests_application_id ON public.fv_information_requests USING btree (application_id);


--
-- Name: ix_fv_information_requests_public_id; Type: INDEX; Schema: public; Owner: finos
--

CREATE UNIQUE INDEX ix_fv_information_requests_public_id ON public.fv_information_requests USING btree (public_id);


--
-- Name: ix_fv_information_requests_status; Type: INDEX; Schema: public; Owner: finos
--

CREATE INDEX ix_fv_information_requests_status ON public.fv_information_requests USING btree (status);


--
-- Name: ix_fv_status_events_application_id; Type: INDEX; Schema: public; Owner: finos
--

CREATE INDEX ix_fv_status_events_application_id ON public.fv_status_events USING btree (application_id);


--
-- Name: ix_fv_users_public_id; Type: INDEX; Schema: public; Owner: finos
--

CREATE UNIQUE INDEX ix_fv_users_public_id ON public.fv_users USING btree (public_id);


--
-- Name: ix_fv_users_username; Type: INDEX; Schema: public; Owner: finos
--

CREATE UNIQUE INDEX ix_fv_users_username ON public.fv_users USING btree (username);


--
-- Name: ix_message_receipts_message_id; Type: INDEX; Schema: public; Owner: finos
--

CREATE INDEX ix_message_receipts_message_id ON public.message_receipts USING btree (message_id);


--
-- Name: ix_message_receipts_user_id; Type: INDEX; Schema: public; Owner: finos
--

CREATE INDEX ix_message_receipts_user_id ON public.message_receipts USING btree (user_id);


--
-- Name: applications applications_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: claims claims_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: claims claims_policy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES public.policies(id) ON DELETE SET NULL;


--
-- Name: documents documents_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: documents documents_uploaded_by_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_user_fkey FOREIGN KEY (uploaded_by_user) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: applications fk_applications_decided_by_user; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT fk_applications_decided_by_user FOREIGN KEY (decided_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: claims fk_claims_resolved_by_user; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT fk_claims_resolved_by_user FOREIGN KEY (resolved_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: fv_audit_logs fv_audit_logs_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_audit_logs
    ADD CONSTRAINT fv_audit_logs_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE SET NULL;


--
-- Name: fv_audit_logs fv_audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_audit_logs
    ADD CONSTRAINT fv_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.fv_users(id);


--
-- Name: fv_communications fv_communications_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_communications
    ADD CONSTRAINT fv_communications_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;


--
-- Name: fv_communications fv_communications_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_communications
    ADD CONSTRAINT fv_communications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.fv_users(id);


--
-- Name: fv_documents fv_documents_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_documents
    ADD CONSTRAINT fv_documents_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;


--
-- Name: fv_documents fv_documents_uploaded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_documents
    ADD CONSTRAINT fv_documents_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES public.fv_users(id);


--
-- Name: fv_information_requests fv_information_requests_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_information_requests
    ADD CONSTRAINT fv_information_requests_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;


--
-- Name: fv_information_requests fv_information_requests_requested_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_information_requests
    ADD CONSTRAINT fv_information_requests_requested_by_id_fkey FOREIGN KEY (requested_by_id) REFERENCES public.fv_users(id);


--
-- Name: fv_information_requests fv_information_requests_resolved_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_information_requests
    ADD CONSTRAINT fv_information_requests_resolved_by_id_fkey FOREIGN KEY (resolved_by_id) REFERENCES public.fv_users(id);


--
-- Name: fv_status_events fv_status_events_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_status_events
    ADD CONSTRAINT fv_status_events_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;


--
-- Name: fv_status_events fv_status_events_changed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.fv_status_events
    ADD CONSTRAINT fv_status_events_changed_by_id_fkey FOREIGN KEY (changed_by_id) REFERENCES public.fv_users(id);


--
-- Name: holdings holdings_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.holdings
    ADD CONSTRAINT holdings_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE SET NULL;


--
-- Name: holdings holdings_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.holdings
    ADD CONSTRAINT holdings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: policies policies_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE SET NULL;


--
-- Name: policies policies_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: users users_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finos
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict bD3dwQ0rOa7X5nAcyLnvtSU30eB7cABcHPgnn5LYC0DMaVWFZHKS2uvyNymAhzM

