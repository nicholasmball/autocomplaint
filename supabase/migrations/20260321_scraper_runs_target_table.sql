-- Add target_table column to scraper_runs to track which table was scraped
ALTER TABLE scraper_runs ADD COLUMN IF NOT EXISTS target_table text NOT NULL DEFAULT 'companies';
