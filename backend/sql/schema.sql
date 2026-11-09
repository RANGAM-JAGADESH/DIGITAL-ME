create extension if not exists vector;

create table if not exists documents (
  id bigserial primary key,
  source text not null,
  chunk_index int not null,
  content text not null,
  embedding vector(384)
);
create index if not exists documents_embedding_idx
  on documents using hnsw (embedding vector_cosine_ops);

-- pre-generated answers (saved answers, later with audio/video urls)
create table if not exists answers (
  id bigserial primary key,
  question text not null,
  answer_text text not null,
  emotion text default 'neutral',
  audio_url text,
  video_url text,
  embedding vector(384),
  created_at timestamptz default now()
);
alter table answers add column if not exists is_suggested boolean default false;
alter table answers add column if not exists faq_number int;
create unique index if not exists answers_faq_number_key on answers (faq_number);
create index if not exists answers_embedding_idx
  on answers using hnsw (embedding vector_cosine_ops);

-- what visitors ask (helps decide which answers to pre-generate next)
create table if not exists question_log (
  id bigserial primary key,
  question text not null,
  source text not null,
  score real,
  created_at timestamptz default now()
);

-- alternative phrasings of each saved question, so paraphrases still match
create table if not exists answer_variants (
  id bigserial primary key,
  answer_id bigint not null references answers(id) on delete cascade,
  question text not null,
  embedding vector(384)
);
create index if not exists answer_variants_embedding_idx
  on answer_variants using hnsw (embedding vector_cosine_ops);

-- Lock the tables away from Supabase's public Data API (the anon key).
-- Your backend connects as the postgres role directly, which is not affected.
alter table documents enable row level security;
alter table answers enable row level security;
alter table question_log enable row level security;
alter table answer_variants enable row level security;
