#!/usr/bin/env python3
"""Generate dev icons with a DEV badge overlay."""

import subprocess
import sys
from pathlib import Path

def ensure_pillow():
    """Ensure Pillow is installed."""
    try:
        from PIL import Image, ImageDraw, ImageFont
        return Image, ImageDraw, ImageFont
    except ImportError:
        print("Installing Pillow...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "-q"])
        from PIL import Image, ImageDraw, ImageFont
        return Image, ImageDraw, ImageFont

def add_dev_badge(img, Image, ImageDraw, ImageFont):
    """Add a DEV badge to the bottom-right corner of the image."""
    width, height = img.size

    # Skip badge for very small icons (badge would be unreadable)
    if width < 48:
        return img

    # Create a drawing context
    draw = ImageDraw.Draw(img)

    # Badge dimensions (proportional to icon size)
    badge_height = max(int(height * 0.22), 10)
    badge_width = max(int(width * 0.45), 20)
    badge_x = width - badge_width - int(width * 0.05)
    badge_y = height - badge_height - int(height * 0.05)

    # Draw badge background (orange/amber color)
    badge_color = (255, 149, 0, 255)  # Orange
    corner_radius = max(int(badge_height * 0.3), 2)

    # Draw rounded rectangle for badge
    draw.rounded_rectangle(
        [badge_x, badge_y, badge_x + badge_width, badge_y + badge_height],
        radius=corner_radius,
        fill=badge_color
    )

    # Add "DEV" text
    font_size = max(int(badge_height * 0.65), 8)
    font = None
    try:
        # Try system fonts
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except (IOError, OSError):
        try:
            font = ImageFont.truetype("/System/Library/Fonts/SFNSMono.ttf", font_size)
        except (IOError, OSError):
            pass

    text = "DEV"

    if font:
        try:
            text_bbox = draw.textbbox((0, 0), text, font=font)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]
        except (OSError, ZeroDivisionError):
            # Fallback for font issues
            text_width = font_size * 2
            text_height = font_size
    else:
        font = ImageFont.load_default()
        text_width = font_size * 2
        text_height = font_size

    text_x = badge_x + (badge_width - text_width) // 2
    text_y = badge_y + (badge_height - text_height) // 2 - int(badge_height * 0.1)

    draw.text((text_x, text_y), text, fill=(255, 255, 255, 255), font=font)

    return img

def main():
    Image, ImageDraw, ImageFont = ensure_pillow()

    # Paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    icons_dir = project_root / "src-tauri" / "icons"
    dev_icons_dir = project_root / "src-tauri" / "icons-dev"

    # Create dev icons directory
    dev_icons_dir.mkdir(exist_ok=True)

    # Source icon (use the largest PNG)
    source_icon = icons_dir / "icon.png"
    if not source_icon.exists():
        print(f"Error: Source icon not found at {source_icon}")
        sys.exit(1)

    # Load source icon
    original = Image.open(source_icon).convert("RGBA")

    # Icon sizes needed for Tauri
    sizes = {
        "32x32.png": 32,
        "64x64.png": 64,
        "128x128.png": 128,
        "128x128@2x.png": 256,
        "icon.png": 512,
        # Windows store logos
        "Square30x30Logo.png": 30,
        "Square44x44Logo.png": 44,
        "Square71x71Logo.png": 71,
        "Square89x89Logo.png": 89,
        "Square107x107Logo.png": 107,
        "Square142x142Logo.png": 142,
        "Square150x150Logo.png": 150,
        "Square284x284Logo.png": 284,
        "Square310x310Logo.png": 310,
        "StoreLogo.png": 50,
    }

    print(f"Generating dev icons in {dev_icons_dir}")

    for filename, size in sizes.items():
        # Resize original to target size
        resized = original.resize((size, size), Image.Resampling.LANCZOS)

        # Add dev badge
        badged = add_dev_badge(resized, Image, ImageDraw, ImageFont)

        # Save
        output_path = dev_icons_dir / filename
        badged.save(output_path, "PNG")
        print(f"  Created {filename} ({size}x{size})")

    # Generate ICO file (Windows)
    ico_sizes = [16, 24, 32, 48, 64, 128, 256]
    ico_images = []
    for size in ico_sizes:
        resized = original.resize((size, size), Image.Resampling.LANCZOS)
        badged = add_dev_badge(resized, Image, ImageDraw, ImageFont)
        ico_images.append(badged)

    ico_path = dev_icons_dir / "icon.ico"
    ico_images[0].save(ico_path, format="ICO", sizes=[(s, s) for s in ico_sizes])
    print(f"  Created icon.ico")

    # Generate ICNS file (macOS) - requires iconutil
    icns_dir = dev_icons_dir / "icon.iconset"
    icns_dir.mkdir(exist_ok=True)

    icns_sizes = [
        (16, "icon_16x16.png"),
        (32, "icon_16x16@2x.png"),
        (32, "icon_32x32.png"),
        (64, "icon_32x32@2x.png"),
        (128, "icon_128x128.png"),
        (256, "icon_128x128@2x.png"),
        (256, "icon_256x256.png"),
        (512, "icon_256x256@2x.png"),
        (512, "icon_512x512.png"),
        (1024, "icon_512x512@2x.png"),
    ]

    for size, filename in icns_sizes:
        resized = original.resize((size, size), Image.Resampling.LANCZOS)
        badged = add_dev_badge(resized, Image, ImageDraw, ImageFont)
        badged.save(icns_dir / filename, "PNG")

    # Convert to ICNS using iconutil
    icns_path = dev_icons_dir / "icon.icns"
    try:
        subprocess.run(
            ["iconutil", "-c", "icns", str(icns_dir), "-o", str(icns_path)],
            check=True,
            capture_output=True
        )
        print(f"  Created icon.icns")
        # Clean up iconset directory
        import shutil
        shutil.rmtree(icns_dir)
    except subprocess.CalledProcessError as e:
        print(f"  Warning: Could not create icon.icns: {e}")
    except FileNotFoundError:
        print("  Warning: iconutil not found, skipping ICNS generation")

    print("\nDev icons generated successfully!")

if __name__ == "__main__":
    main()
