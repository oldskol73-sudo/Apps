// Draws the app icon and splash mark (the "12 SCENTS" badge from the bottle label) into assets/.
// Run: swift scripts/make-icons.swift   (macOS only; uses CoreGraphics + the bundled Jost font)
import AppKit
import CoreText

let root = URL(fileURLWithPath: CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : FileManager.default.currentDirectoryPath)
let fontDir = root.appendingPathComponent("node_modules/@expo-google-fonts/jost")

func color(_ hex: UInt32, _ a: CGFloat = 1) -> CGColor {
  CGColor(red: CGFloat((hex >> 16) & 0xff) / 255, green: CGFloat((hex >> 8) & 0xff) / 255, blue: CGFloat(hex & 0xff) / 255, alpha: a)
}
let dark = color(0x1E1814), brass = color(0xC99A3F), brassLight = color(0xE3C47E), cream = color(0xF4EEE5)

func jost(_ weight: String, _ size: CGFloat) -> CTFont {
  let url = fontDir.appendingPathComponent("\(weight)/Jost_\(weight).ttf")
  guard let desc = (CTFontManagerCreateFontDescriptorsFromURL(url as CFURL) as? [CTFontDescriptor])?.first else { fatalError("Missing font \(url.path)") }
  return CTFontCreateWithFontDescriptor(desc, size, nil)
}

/// Octagon with chamfered corners, like the label badge.
func badgePath(_ r: CGRect, chamfer c: CGFloat) -> CGPath {
  let p = CGMutablePath()
  p.move(to: CGPoint(x: r.minX + c, y: r.minY))
  p.addLine(to: CGPoint(x: r.maxX - c, y: r.minY)); p.addLine(to: CGPoint(x: r.maxX, y: r.minY + c))
  p.addLine(to: CGPoint(x: r.maxX, y: r.maxY - c)); p.addLine(to: CGPoint(x: r.maxX - c, y: r.maxY))
  p.addLine(to: CGPoint(x: r.minX + c, y: r.maxY)); p.addLine(to: CGPoint(x: r.minX, y: r.maxY - c))
  p.addLine(to: CGPoint(x: r.minX, y: r.minY + c)); p.closeSubpath()
  return p
}

func drawText(_ ctx: CGContext, _ s: String, font: CTFont, color: CGColor, centerX: CGFloat, baseline: CGFloat, tracking: CGFloat = 0) {
  let attr = NSAttributedString(string: s, attributes: [.font: font, .foregroundColor: color, .kern: tracking])
  let line = CTLineCreateWithAttributedString(attr)
  let w = CTLineGetTypographicBounds(line, nil, nil, nil) - Double(tracking) // trailing kern
  ctx.textPosition = CGPoint(x: centerX - CGFloat(w) / 2, y: baseline)
  CTLineDraw(line, ctx)
}

/// The badge, drawn inside `r` (square). `full` fills the whole canvas edge to edge (app icon).
func drawBadge(_ ctx: CGContext, _ r: CGRect, full: Bool) {
  let u = r.width / 1024
  if !full { ctx.addPath(badgePath(r, chamfer: 150 * u)); ctx.setFillColor(dark); ctx.fillPath() }
  else { ctx.setFillColor(dark); ctx.fill(r) }
  // Thin brass inner frame
  let inset: CGFloat = full ? 96 : 56
  ctx.addPath(badgePath(r.insetBy(dx: inset * u, dy: inset * u), chamfer: (full ? 120 : 112) * u))
  ctx.setStrokeColor(brass); ctx.setLineWidth(10 * u); ctx.strokePath()
  let cx = r.midX
  // — SCENTS —
  drawText(ctx, "SCENTS", font: jost("500Medium", 64 * u), color: brassLight, centerX: cx, baseline: r.minY + 760 * u, tracking: 22 * u)
  ctx.setStrokeColor(brassLight); ctx.setLineWidth(5 * u)
  for (a, b) in [(236.0, 306.0), (718.0, 788.0)] {
    ctx.move(to: CGPoint(x: r.minX + CGFloat(a) * u, y: r.minY + 782 * u)); ctx.addLine(to: CGPoint(x: r.minX + CGFloat(b) * u, y: r.minY + 782 * u))
  }
  ctx.strokePath()
  // 12
  drawText(ctx, "12", font: jost("700Bold", 440 * u), color: cream, centerX: cx, baseline: r.minY + 380 * u, tracking: -8 * u)
  // Brass bar
  ctx.setFillColor(brass); ctx.fill(CGRect(x: r.minX + 300 * u, y: r.minY + 262 * u, width: 424 * u, height: 54 * u))
}

func render(_ name: String, size: Int, opaque: Bool, _ draw: (CGContext, CGRect) -> Void) {
  let cs = CGColorSpace(name: CGColorSpace.sRGB)!
  let info = opaque ? CGImageAlphaInfo.noneSkipLast.rawValue : CGImageAlphaInfo.premultipliedLast.rawValue
  let ctx = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0, space: cs, bitmapInfo: info)!
  ctx.setShouldAntialias(true); ctx.setAllowsFontSmoothing(true)
  draw(ctx, CGRect(x: 0, y: 0, width: size, height: size))
  let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
  let out = root.appendingPathComponent("assets/\(name)")
  try! FileManager.default.createDirectory(at: out.deletingLastPathComponent(), withIntermediateDirectories: true)
  try! rep.representation(using: .png, properties: [:])!.write(to: out)
  print("wrote assets/\(name)")
}

// App Store icon: 1024², no alpha, full bleed (iOS applies the corner mask).
render("icon.png", size: 1024, opaque: true) { ctx, r in drawBadge(ctx, r, full: true) }
// Splash mark: transparent badge, shown centred on the cream splash background.
render("splash-icon.png", size: 1024, opaque: false) { ctx, r in drawBadge(ctx, r.insetBy(dx: 24, dy: 24), full: false) }
