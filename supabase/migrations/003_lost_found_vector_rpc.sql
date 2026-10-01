-- Vector search RPC for Lost & Found items
CREATE OR REPLACE FUNCTION match_lost_found_items(
  p_type lost_found_item_type,
  p_text_embedding vector(384),
  p_image_embedding vector(512),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  title text,
  category text,
  text_similarity float,
  image_similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lfi.id,
    lfi.title,
    lfi.category,
    -- Cosine similarity: 1 - cosine_distance
    (1 - (lfi.text_embedding <=> p_text_embedding))::float as text_similarity,
    (CASE WHEN p_image_embedding IS NOT NULL AND lfi.primary_image_embedding IS NOT NULL 
          THEN (1 - (lfi.primary_image_embedding <=> p_image_embedding))
          ELSE 0 
     END)::float as image_similarity
  FROM public.lost_found_items lfi
  WHERE lfi.type = p_type
    AND lfi.status = 'open'
    AND lfi.text_embedding IS NOT NULL
    AND (1 - (lfi.text_embedding <=> p_text_embedding)) > match_threshold
  ORDER BY lfi.text_embedding <=> p_text_embedding
  LIMIT match_count;
END;
$$;
