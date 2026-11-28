import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("penguinsolutions/assets");
fs.mkdirSync(OUT_DIR, { recursive: true });

const ASSETS = [
  // Hero & CTA videos + poster
  {
    name: "hero-poster.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/6a8620d85b5e9b8589e40e3b_video-thumbnail--home-darker--16-9-p-1600.avif",
  },
  {
    name: "hero-bg.mp4",
    url: "https://player.vimeo.com/progressive_redirect/playback/1219678439/rendition/1080p/file.mp4%20%281080p%29.mp4?loc=external&log_user=0&signature=1866489e0cd5a51e0d13837c832fb7e38f77d907919214cc406bc27414ef5da5",
  },
  {
    name: "experts-bg.mp4",
    url: "https://player.vimeo.com/progressive_redirect/playback/1064465021/rendition/1080p/file.mp4?loc=external&log_user=0&signature=432c4060540eb6e22a2200731ec83e72bc0b3d6213eaff83c1aa0fbe107ae99d&user_id=137540222",
  },

  // Nav featured thumbnails
  {
    name: "nav-servers.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67bf53d68b0744bc5602be3d_servers--4-3.avif",
  },
  {
    name: "nav-racks.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67bf53d67563752c57104934_datacenter-server-racks-alt--4-3.avif",
  },
  {
    name: "nav-clusterware.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67cf7cc7c6034215e8f1f49d_6745a027f82122f4b385f7f1414824ec_clusterware--4-3.avif",
  },
  {
    name: "nav-cxl.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/6a63a6e6eb8faca55a282616_product-cxl-server-gray4-bkg--4-3.avif",
  },
  {
    name: "nav-story.jpg",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/688b6712d55545ae80da38ce_nav-story.jpg",
  },

  // Platform diagram
  {
    name: "platform-diagram.webp",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/6a0f46053275074d9572b88d_21f01c79ec096055b11f1d2a979e6525_accordion-image--ai-factory-platform-model--1-1.webp",
  },

  // Customer logos (accordion)
  {
    name: "logo-sk-telecom.png",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/697beec0fd2c400237dade54_sk-telecom.png",
  },
  {
    name: "logo-bp.png",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/6a44455148fc8e0003d0f9aa_532b912358e0564a019da6e71eb630e0_customer--accordion--logo--bp.png",
  },
  {
    name: "logo-deepgram.png",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/6a44455188054dd8d3280654_customer--accordion--logo--deepgram.png",
  },
  {
    name: "logo-georgia-tech.png",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67c87f8de3601ac8456c43ff_georgia-tech.png",
  },
  {
    name: "logo-sandia.png",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67c87f8d4f501c8b1485371b_sandia.png",
  },
  {
    name: "logo-shell.png",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67c87f036707ca999ebdf675_shell-accordion.png",
  },

  // Customer photos
  {
    name: "customer-sk-telecom.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/697bf21091fe9397774c586d_accordion-image--sk-telecom-haein--1-1.avif",
  },
  {
    name: "customer-bp.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/6a44449e2a94edc351f461f7_accordion-image--bp-bldg--1-1.avif",
  },
  {
    name: "customer-deepgram.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/6a4548146c03ae0f43a270b1_accordion-image--deepgram--1-1.avif",
  },
  {
    name: "customer-georgia-tech.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67c6beb17b9a4400ab8be6d6_image--georgia-tech--1-1.avif",
  },
  {
    name: "customer-sandia.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67c4d8fc4755de01f09d2352_penguin-lab-rack-mount--4-3.avif",
  },
  {
    name: "customer-shell.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67c6c12a97cca238ffab8ffb_accordion-image--shell--1-1.avif",
  },

  // Industries (12)
  {
    name: "industry-ai-cloud.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/6a174020b4b2caf5ace523d1_d6df7fc9bf675ee5b79af4fbd02868ea_industry-neoclouds--4-3.avif",
  },
  {
    name: "industry-sovereign-ai.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/6a91d7f74a0d69ccd38bc6cf_industry-sovereign-ai--4-3.avif",
  },
  {
    name: "industry-financial.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67c090d18373fa90b309369d_financial-services--4-3.avif",
  },
  {
    name: "industry-oil-gas.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67c090cb213c4101507978f4_oil-gas-energy--4-3.avif",
  },
  {
    name: "industry-life-sciences.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67bf53b9e5316c7671cda634_lifescience-dna--4-3.avif",
  },
  {
    name: "industry-higher-ed.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67bde7489ce25bf8dc5acb6c_students-at-desk-monitor--4-3.avif",
  },
  {
    name: "industry-government.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/69028e4e4d528ec6ca1a2b39_industry-fed-government--4-3.avif",
  },
  {
    name: "industry-weather.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67be3fe6ed06cfd844915bdd_weather-sensors--4-3.avif",
  },
  {
    name: "industry-manufacturing.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67be7740f77331de5e798c71_rivets-welds-seals--4-3.avif",
  },
  {
    name: "industry-retail.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67eb552901467957fbb113ad_industry-retail--4-3.avif",
  },
  {
    name: "industry-critical-infra.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67eb552ac0bec22abd564a5d_industry-critical-infrastructure--4-3.avif",
  },
  {
    name: "industry-transportation.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67eb552c331a6cc7f157ecba_f8eaa51f86f8ecd994b4f8a6fba7d7c6_industry-transportation--4-3.avif",
  },

  // Process (4)
  {
    name: "process-design.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67c20e43e67599d54c6fb3e9_empty-server-room--4-3.avif",
  },
  {
    name: "process-build.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67c4c0c2fb2041fb4ce314f1_penguin-lab-cabling--4-3.avif",
  },
  {
    name: "process-deploy.webp",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67cb5e044191179f3a33e099_6fafc4f4256f92a12c947964087cdf84_server-room-left--4-3.webp",
  },
  {
    name: "process-manage.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67c0885c2a7c3b5d0cfd4b1b_11b564ed6391b140a919ffc075611c72_data-center-rack-man--4-3.avif",
  },

  // Testimonial logos (5)
  {
    name: "testimonial-lektra.webp",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/6aa9aea1c56b7c96c604e6e1_dc2495d452f37a3305a3f710540081fb_customer--logo--lektra.webp",
  },
  {
    name: "testimonial-bp.webp",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/6a444639d66ddff7e2989029_0bc6ecad9bf8c9c8f1fc733171da0b70_customer--logo--bp.webp",
  },
  {
    name: "testimonial-deepgram.webp",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/69e2516cde2e67b623cceadf_f0aef72069ebb2f2482922ccbd706d5f_customer--logo--deepgram.webp",
  },
  {
    name: "testimonial-georgia-tech.webp",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67c6bc27cae94a7bbe7b3b00_d0f560de0f125b730e7eef52d2b42806_customer--logo--georgia-tech.webp",
  },
  {
    name: "testimonial-voltage-park.webp",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67c6bc27e67bc20c39403f9d_8ad6ec02665b258d6bfbb33103323d4a_customer--logo--voltage-park.webp",
  },

  // Products (9; clusterware and racks reuse nav-clusterware/nav-racks or save distinct copies)
  {
    name: "product-originai.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67c225174c63ce445cb9b188_5860dde146b7b25ea63dba6dd0416939_network-monitor-tablet--4-3.avif",
  },
  {
    name: "product-ztc-endurance.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67cf0f38796c750bc9a8cfb6_63329ae5f487f852e31f05bae7de45c2_product-ztc-endurance--4-3.avif",
  },
  {
    name: "product-ztc-edge.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67cf0f38a223cccef7fd0e77_4503fed3d05d858de6a37e2d5de82c1b_product-ztc-edge--4-3.avif",
  },
  {
    name: "product-everrun.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67cf0f38f5081698d091afe2_80ee394e465dc9032ca5af29c44caab6_product-ever-run--4-3.avif",
  },
  {
    name: "product-cxl.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67cf1734710bf70f0a0d3c42_5c3f038206415d50cec1d35301333351_product-cxl--4-3.avif",
  },
  {
    name: "product-zdimm.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67cf1733776b60ba473271cf_95a060bb014b85350ec6cc3058d636b1_product-zdimm--4-3.avif",
  },
  {
    name: "product-flash.avif",
    url: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/67cf17340df14f556c7fad9b_4a7dacb07f3ddd515e476c8a798f7b96_product-flash--4-3.avif",
  },

  // News Corner (36)
  { name: "news-01.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/6afb349f2bf0401ecb424482_card--pma-news--4-3.webp" },
  { name: "news-02.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/6aecf0749724c26e55fccc2d_Agreement-to-Sell-Cree-LED.webp" },
  { name: "news-03.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/6acfdda1a68d1d15f46e4bf4_card--axe-compute--4-3.webp" },
  { name: "news-04.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/6ace9f1744ac7940377c37ce_card--ai-awards-winner--4-3.webp" },
  { name: "news-05.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/6ab3ec8e1ab952f450c65a76_card--tech-ascension-award-26--4-3.webp" },
  { name: "news-06.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/6ab44f52741ecaa866576881_card--andy-mills-ai-infra--4-3.webp" },
  { name: "news-07.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/6aa22f47982135698a8d1317_card-lektra-press-photo--4-3.webp" },
  { name: "news-08.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/6a99eba6fa0bd2382837b0c0_thumb--haein-cluster--4-3.webp" },
  { name: "news-09.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/6a6bb655069244b589697c30_card-cnbc-exclusive-feature--4-3.webp" },
  { name: "news-10.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/6a3d25b08bc8d7b719c7b75c_card-cw-ops-agent--4-3.webp" },
  { name: "news-11.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/6a3aa1df23ca2c6819c2f95c_ai-factory-kv.webp" },
  { name: "news-12.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/6a20595906d6b5200fade9cd_dell-partner-award.webp" },
  { name: "news-13.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/6a1058b8bbe6129038caa76e_hbm-chip-illustration.webp" },
  { name: "news-14.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/69efdb55364884420a1e4c8f_climate-leaders-earth-day-2026.webp" },
  { name: "news-15.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/69b96eecd55b07a7f3f7fe04_deepgram-story.webp" },
  { name: "news-16.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/69b8c17f120c2daf46b4e8ae_altus-kv-cache-expansion-server.webp" },
  { name: "news-17.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/69810e4e4c4953c110c1a745_welcome-kash-shaikh.webp" },
  { name: "news-18.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/69593d1272be3ee2aecef0c3_card-sandia-announces-spectra.webp" },
  { name: "news-19.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/68938b743195a26eebb4234b_card--sk-news.webp" },
  { name: "news-20.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/685b1c21308db2bcd740c434_card-5-design-considerations-ebook--4-3.webp" },
  { name: "news-21.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/685b1d063cecef4e55ca3030_card-cdw-partnership--4-3.webp" },
  { name: "news-22.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/685b1cba8b55cd09bbd06aa5_card-award-badge-hpc-2025--4-3.webp" },
  { name: "news-23.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/67e1e0ca44e8e1c9690580bc_ai-award-badge--4-3.webp" },
  { name: "news-24.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/67c8ec266e8b57d41fcec8d4_rebellions-penguin-solutions-SK-Telecom--4-3.webp" },
  { name: "news-25.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/67cdf1c5463855477ff9a1fb_hammerspace-interview-simplifying-AI-complexity-with-data-management--4-3.webp" },
  { name: "news-26.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/67c74e8e75f413d736dd555c_penguin-sk-telecom-sk-hynix-deal--4-3.webp" },
  { name: "news-27.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/67c74eeb127f33f5c23740f3_originAI-promo-slide--4-3.webp" },
  { name: "news-28.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/67c74f24bdef2f44d82a3e3b_showcase-ai-optimized-solutions-sc4-dell--4-3.webp" },
  { name: "news-29.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/67c74f38723f33107f1f68e5_voltage-park-rack--4-3.webp" },
  { name: "news-30.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/67c8e75d131f9ae51f85032c_sandia-vanguard-news.webp" },
  { name: "news-31.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/67c74f5c6effe38fec57727c_makerspace-ai-lab--4-3.webp" },
  { name: "news-32.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/67c8e54a55b07202631b010c_AI-makerspace-georgia-tech--4-3.webp" },
  { name: "news-33.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/67c35ac9d9ff72e4dbfbf738_thumb--ai-chip-on%20circuite-board--4-3.webp" },
  { name: "news-34.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/67c74fc1e525e57713124694_grc-shell-houston-immersion-pod--4-3.webp" },
  { name: "news-35.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/67c74ff549211469739c1521_DoD-supercomputing-platform--4-3.webp" },
  { name: "news-36.webp", url: "https://cdn.prod.website-files.com/67b6e966d3351a073b085b9c/67c75001bdef2f44d82b2b65_meta-supercomputer-data-center--4-3.webp" },
];

async function downloadAll() {
  const concurrency = 6;
  let idx = 0;
  const failures = [];

  async function worker() {
    while (idx < ASSETS.length) {
      const item = ASSETS[idx++];
      const dest = path.join(OUT_DIR, item.name);
      if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
        console.log(`SKIP ${item.name} (${fs.statSync(dest).size} bytes)`);
        continue;
      }
      try {
        const res = await fetch(item.url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Referer: "https://www.penguinsolutions.com/",
          },
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const buf = Buffer.from(await res.arrayBuffer());
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("text/html")) {
          throw new Error(`Unexpected HTML response (${ct})`);
        }
        fs.writeFileSync(dest, buf);
        console.log(`OK   ${item.name} (${buf.length} bytes, ${ct})`);
      } catch (err) {
        console.error(`FAIL ${item.name}: ${err.message}`);
        failures.push({ name: item.name, url: item.url, error: err.message });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  console.log(`\nDone. Total: ${ASSETS.length}, Failures: ${failures.length}`);
  if (failures.length) {
    console.error(JSON.stringify(failures, null, 2));
    process.exit(1);
  }
}

downloadAll();
