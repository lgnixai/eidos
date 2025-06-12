export const templates = [
  {
    name: "queryAllFiles",
    i18nKey: "dataview.template.queryAllFiles",
    descriptionKey: "dataview.template.queryAllFiles.description",
    tags: ["file"],
    sql: `
SELECT
    *,
    CASE
        WHEN path LIKE 'spaces/%' THEN substr(path, 7)
        ELSE path
    END AS path_display
FROM eidos__files
    `
  },
  {
    name: "queryAllImages",
    i18nKey: "dataview.template.queryAllImages",
    descriptionKey: "dataview.template.queryAllImages.description",
    tags: ["file", "image"],
    sql: `
SELECT 
    *,
    CASE
        WHEN path LIKE 'spaces/%' THEN substr(path, 7)
        ELSE path
    END AS path_display    
FROM eidos__files WHERE mime LIKE 'image/%'
    `
  },
  {
    name: "queryAllBookmarksInDocs",
    i18nKey: "dataview.template.queryAllBookmarksInDocs",
    descriptionKey: "dataview.template.queryAllBookmarksInDocs.description",
    tags: ["doc", "bookmark"],
    sql: `
WITH valid_docs AS (
    SELECT id, content, created_at
    FROM eidos__docs
    WHERE json_valid(content) = 1
)
SELECT
    d.id as doc_id,
    d.created_at as created_at,
    json_extract(j.value, '$.type') as type,
    json_extract(j.value, '$.title') as title,
    json_extract(j.value, '$.url') as url,
    json_extract(j.value, '$.description') as description,
    json_extract(j.value, '$.image') as image,
    json_extract(j.value, '$.fetched') as fetched,
    j.value as raw_node
FROM valid_docs d,
    json_tree(d.content, '$.root.children') AS j
WHERE j.type = 'object'
AND json_extract(j.value, '$.type') = 'bookmark';
`
  }, {
    name: "queryAllChecklistsInDocs",
    i18nKey: "dataview.template.queryAllChecklistsInDocs",
    descriptionKey: "dataview.template.queryAllChecklistsInDocs.description",
    tags: ["doc", "checklist"],
    sql: `
WITH
  valid_docs AS (
    SELECT
      id,
      content,
      created_at
    FROM
      eidos__docs
    WHERE
      json_valid(content) = 1
  )
SELECT
  json_extract(j.value, '$.children[0].text') as text,
  json_extract(j.value, '$.checked') as checked,
  d.id as doc_id,
  j.value as raw_node
FROM
  valid_docs d,
  json_tree(d.content, '$.root.children') AS parent,
  json_tree(parent.value, '$.children') AS j
WHERE
  parent.type = 'object'
  AND json_extract(parent.value, '$.type') = 'list'
  AND json_extract(parent.value, '$.listType') = 'check'
  AND j.type = 'object'
  AND json_extract(j.value, '$.type') = 'listitem'
        `
  },
  {
    name: "queryAllMermaidDiagramsInDocs",
    i18nKey: "dataview.template.queryAllMermaidDiagramsInDocs",
    descriptionKey: "dataview.template.queryAllMermaidDiagramsInDocs.description",
    tags: ["doc", "mermaid"],
    sql: `
WITH
  valid_docs AS (
    SELECT
      id,
      content
    FROM
      eidos__docs
    WHERE
      json_valid(content) = 1
  )
SELECT
  json_extract(j.value, '$.text') as text,
  d.id as doc_id,
  j.value as raw_node
FROM
  valid_docs d,
  json_tree(d.content, '$.root.children') AS j
WHERE
  j.type = 'object'
  AND json_extract(j.value, '$.type') = 'mermaid'
    `
  }
]
