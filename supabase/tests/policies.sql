-- Walks a recipe through every status as different users. Each step says what to expect; run
-- with supabase/tests/run.sh and read the output.
\set ON_ERROR_STOP 0
\set QUIET 1
-- users: a author, b other contributor, m moderator, n second moderator
insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000a'),('00000000-0000-0000-0000-00000000000b'),('00000000-0000-0000-0000-00000000000c'),('00000000-0000-0000-0000-00000000000d');
update profiles set role='moderator' where id in ('00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-00000000000d');
create temp table ids (k text primary key, v uuid); grant all on ids to authenticated, anon;
create function pg_temp.as_user(u text) returns void language sql as $$ select set_config('test.uid', u, false) $$;

set role authenticated; select set_config('test.uid','00000000-0000-0000-0000-00000000000a',false);
\echo '== A creates a draft'
insert into recipes (title, category, image_path, ingredients, method) values ('Toast', 'Breakfast', '00000000-0000-0000-0000-00000000000a/toast.jpg', '[{"name":"bread","measure":"2 slices"}]', '[{"title":null,"steps":["Toast it"]}]') returning (id is not null) as created \gset
insert into ids select 'r', id from recipes where title='Toast';
\echo '== A cannot set status directly (expect permission denied)'
update recipes set status='published' where title='Toast';
\echo '== A cannot insert for someone else (expect RLS error)'
insert into recipes (author_id, title) values ('00000000-0000-0000-0000-00000000000b','Spoof');
\echo '== A cannot make themselves moderator (expect permission denied)'
update profiles set role='moderator' where id=auth.uid();
\echo '== A renames themselves (expect UPDATE 1)'
\set QUIET 0
update profiles set display_name='Ada' where id=auth.uid();
\set QUIET 1
\echo '== A cannot approve own recipe (expect cannot be moved)'
select status from change_recipe_status((select v from ids where k='r'),'approved');
\echo '== Incomplete recipe cannot be submitted (expect Add a title...)'
insert into recipes (title) values ('Empty');
select status from change_recipe_status((select id from recipes where title='Empty'),'submitted');
\echo '== A submits Toast (expect submitted)'
select status from change_recipe_status((select v from ids where k='r'),'submitted');
\echo '== A cannot edit once submitted (expect UPDATE 0)'
\set QUIET 0
update recipes set title='Changed' where title='Toast';
\set QUIET 1

select set_config('test.uid','00000000-0000-0000-0000-00000000000b',false);
\echo '== B cannot see A recipes (expect 0)'
select count(*) from recipes;
\echo '== B cannot move A recipe (expect not found)'
select status from change_recipe_status((select v from ids where k='r'),'draft');
\echo '== B cannot upload into A folder (expect RLS error)'
insert into storage.objects (bucket_id,name) values ('recipe-uploads','00000000-0000-0000-0000-00000000000a/x.jpg');
\echo '== B uploads into own folder (expect ok)'
\set QUIET 0
insert into storage.objects (bucket_id,name) values ('recipe-uploads','00000000-0000-0000-0000-00000000000b/x.jpg');
\set QUIET 1

select set_config('test.uid','00000000-0000-0000-0000-00000000000c',false);
\echo '== Moderator sees all (expect 2) and uploads (expect 1)'
select count(*) from recipes; select count(*) from storage.objects;
\echo '== Moderator cannot publish before approval (expect cannot be moved)'
select status from change_recipe_status((select v from ids where k='r'),'published');
\echo '== Reject without reason fails (expect Say why)'
select status from change_recipe_status((select v from ids where k='r'),'rejected');
\echo '== Moderator rejects with reason (expect rejected)'
select status, review_note from change_recipe_status((select v from ids where k='r'),'rejected','Add timings');

select set_config('test.uid','00000000-0000-0000-0000-00000000000a',false);
\echo '== A edits rejected recipe and resubmits (expect UPDATE 1, then submitted with note cleared)'
\set QUIET 0
update recipes set title='Better toast' where id=(select v from ids where k='r');
\set QUIET 1
select status, review_note is null as note_cleared from change_recipe_status((select v from ids where k='r'),'submitted');

select set_config('test.uid','00000000-0000-0000-0000-00000000000c',false);
select status from change_recipe_status((select v from ids where k='r'),'under_review');
select status from change_recipe_status((select v from ids where k='r'),'approved','Looks good');
\echo '== Publish (expect published)'
select status, published_at is not null from change_recipe_status((select v from ids where k='r'),'published');

reset role; set role anon; select set_config('test.uid','',false);
\echo '== Visitors: no access to recipes table (expect permission denied)'
select count(*) from recipes;
\echo '== Visitors see published view with display name and no review fields'
select title, contributor from published_recipes;
select review_note from published_recipes;

reset role; set role authenticated; select set_config('test.uid','00000000-0000-0000-0000-00000000000a',false);
\echo '== A cannot edit or delete published (expect UPDATE 0 / DELETE 0)'
\set QUIET 0
update recipes set title='Hack' where id=(select v from ids where k='r');
delete from recipes where id=(select v from ids where k='r');
\set QUIET 1
\echo '== History visible to author (expect 6 transitions)'
select from_status, to_status, note from recipe_events order by id;
