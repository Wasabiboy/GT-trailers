#!/usr/bin/env python3
"""
GT Trailers Image Downloader
Run this script on your local machine to download all images from GT Trailers website
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import os
from pathlib import Path
import time

def get_all_images_from_page(url, session):
    """Extract all image URLs from a single page"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        response = session.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        image_urls = set()
        
        # Find all img tags
        for img in soup.find_all('img'):
            src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
            if src:
                # Make absolute URL
                abs_url = urljoin(url, src)
                # Filter out tiny icons and data URIs, but keep logos
                if not abs_url.startswith('data:') and not any(x in abs_url.lower() for x in ['icon', 'favicon']):
                    image_urls.add(abs_url)
        
        # Find background images in style attributes
        for tag in soup.find_all(style=True):
            style = tag.get('style', '')
            if 'background-image:url(' in style.replace(' ', ''):
                # Extract URL from style
                import re
                urls = re.findall(r'url\(["\']?([^"\')\s]+)["\']?\)', style)
                for img_url in urls:
                    abs_url = urljoin(url, img_url)
                    if not abs_url.startswith('data:'):
                        image_urls.add(abs_url)
        
        return list(image_urls), soup
        
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return [], None

def get_all_trailer_pages(base_url, session):
    """Find all trailer product pages"""
    pages_to_check = [
        base_url,
        f"{base_url}/trailers/",
        f"{base_url}/boat-trailers/",
        f"{base_url}/hardware/",
        f"{base_url}/contact-us/",
    ]
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    # Try to find more pages from the main page
    try:
        response = session.get(base_url, headers=headers, timeout=30)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find all links that might be trailer pages
        for link in soup.find_all('a', href=True):
            href = link['href']
            full_url = urljoin(base_url, href)
            if base_url in full_url and any(keyword in full_url.lower() for keyword in ['trailer', 'boat', 'product']):
                if full_url not in pages_to_check:
                    pages_to_check.append(full_url)
    except Exception as e:
        print(f"Error finding pages: {e}")
    
    return list(set(pages_to_check))

def download_image(url, output_dir, session, filename=None):
    """Download a single image"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        # Get filename from URL if not provided
        if not filename:
            parsed_url = urlparse(url)
            filename = os.path.basename(parsed_url.path)
            
            # If no filename, generate one
            if not filename or '.' not in filename:
                ext = '.jpg'
                if 'png' in url.lower():
                    ext = '.png'
                elif 'gif' in url.lower():
                    ext = '.gif'
                elif 'webp' in url.lower():
                    ext = '.webp'
                filename = f"image_{hash(url) % 100000}{ext}"
        
        filepath = os.path.join(output_dir, filename)
        
        # Skip if already exists
        if os.path.exists(filepath):
            print(f"  [SKIP] Already exists: {filename}")
            return True
        
        # Download image
        response = session.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        # Save image
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        print(f"  [OK] Downloaded: {filename} ({len(response.content):,} bytes)")
        return True
        
    except Exception as e:
        print(f"  [FAIL] Failed: {filename} - {e}")
        return False

def main():
    base_url = "https://www.gttrailers.co.nz"
    output_dir = "./images"
    
    # Create output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {output_dir}\n")
    print("="*60)
    
    # Create session for connection pooling
    session = requests.Session()
    
    # Find all trailer pages
    print("Finding trailer pages...")
    pages = get_all_trailer_pages(base_url, session)
    print(f"Found {len(pages)} pages to check\n")
    print("="*60)
    
    all_images = set()
    
    # Collect images from all pages
    for i, page_url in enumerate(pages, 1):
        print(f"\n[{i}/{len(pages)}] Checking: {page_url}")
        images, soup = get_all_images_from_page(page_url, session)
        
        if images:
            print(f"  Found {len(images)} images")
            all_images.update(images)
        
        # Be nice to the server
        time.sleep(0.5)
    
    print("\n" + "="*60)
    print(f"Total unique images found: {len(all_images)}")
    print("="*60)
    
    # Download all images
    downloaded = 0
    failed = 0
    
    for i, img_url in enumerate(sorted(all_images), 1):
        print(f"\n[{i}/{len(all_images)}] {img_url}")
        if download_image(img_url, output_dir, session):
            downloaded += 1
        else:
            failed += 1
        
        # Be nice to the server
        time.sleep(0.3)
    
    print("\n" + "="*60)
    print("DOWNLOAD COMPLETE!")
    print(f"Total images found: {len(all_images)}")
    print(f"Successfully downloaded: {downloaded}")
    print(f"Failed: {failed}")
    print(f"Saved to: {os.path.abspath(output_dir)}")
    print("="*60)

if __name__ == "__main__":
    # Check dependencies
    try:
        import requests
        from bs4 import BeautifulSoup
    except ImportError:
        print("Missing dependencies!")
        print("Please install them with:")
        print("  pip install requests beautifulsoup4")
        exit(1)
    
    main()
