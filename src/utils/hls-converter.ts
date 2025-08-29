import * as path from 'path';
import { supabase } from './supabase';
import * as fs from 'fs';
import { BadRequestException } from '@nestjs/common';
import { spawn } from 'child_process'


const MAXIMUM_BITRATE_720P = 5 * 10 ** 6; // 5Mbps
const MAXIMUM_BITRATE_1080P = 8 * 10 ** 6; // 8Mbps
const MAXIMUM_BITRATE_1440P = 16 * 10 ** 6; // 16Mbps

export const checkVideoHasAudio = async (filePath: string) => {
  const { $ } = await import('zx');
  const slash = (await import('slash')).default;

  console.log('Checking if video has audio stream:', filePath);
  const { stdout } = await $`ffprobe ${[
    '-v',
    'error',
    '-select_streams',
    'a:0',
    '-show_entries',
    'stream=codec_type',
    '-of',
    'default=nw=1:nk=1',
    slash(filePath),
  ]}`;
  return stdout.trim() === 'audio';
};

const getBitrate = async (filePath: string) => {
  const { $ } = await import('zx');
  const slash = (await import('slash')).default;

  // Ưu tiên đọc bitrate từ stream video
  const { stdout: streamOut } = await $`ffprobe ${[
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=bit_rate',
    '-of',
    'default=nw=1:nk=1',
    slash(filePath),
  ]}`;

  let bitrate = Number(streamOut.trim());

  if (!streamOut.trim() || isNaN(bitrate) || bitrate === 0) {
    // Fallback: đọc bitrate từ định dạng tổng
    const { stdout: formatOut } = await $`ffprobe ${[
      '-v',
      'error',
      '-show_entries',
      'format=bit_rate',
      '-of',
      'default=nw=1:nk=1',
      slash(filePath),
    ]}`;
    bitrate = Number(formatOut.trim());
  }

  if (isNaN(bitrate) || bitrate === 0) {
    throw new Error(`Unable to parse video bitrate from file: ${filePath}`);
  }

  return bitrate;
};

export const getDuration = async (filePath: string) => {
  const { $ } = await import('zx');
  const slash = (await import('slash')).default;
  const { stdout } =
    await $`ffprobe -v error -show_entries format=duration -of csv=p=0 ${slash(filePath)}`;

  console.log(`Video duration: ${stdout.trim()} seconds`);
  return parseFloat(stdout.trim());
};

export const getResolution = async (filePath: string) => {
  const { $ } = await import('zx');
  const slash = (await import('slash')).default;

  // const { stdout } = await $`ffprobe ${[
  //   '-v',
  //   'error',
  //   '-select_streams',
  //   'v:0',
  //   '-show_entries',
  //   'stream=width,height',
  //   '-of',
  //   'csv=s=x:p=0',
  //   slash(filePath),
  // ]}`;
  // Use a template string instead of an array for PowerShell compatibility
  const { stdout } = await $`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 ${slash(filePath)}`;
  const resolution = stdout.trim().split('x');
  const [width, height] = resolution;
  return {
    width: Number(width),
    height: Number(height),
  };
};

const getWidth = (
  height: number,
  resolution: { width: number; height: number },
) => {
  const width = Math.round((height * resolution.width) / resolution.height);
  // Vì ffmpeg yêu cầu width và height phải là số chẵn
  return width % 2 === 0 ? width : width + 1;
};

type EncodeByResolution = {
  inputPath: string;
  isHasAudio: boolean;
  resolution: {
    width: number;
    height: number;
  };
  outputSegmentPath: string;
  outputPath: string;
  bitrate: {
    720: number;
    1080: number;
    1440: number;
    original: number;
  };
};

const encodeMax720 = async ({
  bitrate,
  inputPath,
  isHasAudio,
  outputPath,
  outputSegmentPath,
  resolution,
}: EncodeByResolution) => {
  const { $ } = await import('zx');
  const slash = (await import('slash')).default;

  const args = [
    '-y',
    '-i',
    slash(inputPath),
    '-preset',
    'fast',
    '-g',
    '48',
    '-crf',
    '23',
    '-sc_threshold',
    '0',
    '-map',
    '0:0',
  ];
  if (isHasAudio) {
    args.push('-map', '0:1');
  }
  args.push(
    '-s:v:0',
    `${getWidth(720, resolution)}x720`,
    '-c:v:0',
    'libx264',
    '-b:v:0',
    `${bitrate[720]}`,
    '-c:a',
    'copy',
  );
  if (isHasAudio) {
    args.push('-var_stream_map', '"v:0,a:0"');
  } else {
    args.push('-var_stream_map', '"v:0"');
  }

  console.log('FFMPEG output args:', slash(outputPath));
  args.push(
    '-master_pl_name',
    'master.m3u8',
    '-f',
    'hls',
    '-hls_time',
    '10',
    '-hls_list_size',
    '0',
    '-hls_segment_filename',
    slash(outputSegmentPath),
    slash(outputPath),
  );

  console.log('FFMPEG ARGS:', args.join(' '));

  const process = spawn('ffmpeg', args, { stdio: 'inherit', shell: true });

  await new Promise((resolve, reject) => {
    process.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
    process.on('error', (err) => {
      reject(err);
    });
  });

  return true;
};

const encodeMax1080 = async ({
  bitrate,
  inputPath,
  isHasAudio,
  outputPath,
  outputSegmentPath,
  resolution,
}: EncodeByResolution) => {
  // const { $ } = await import('zx');
  const slash = (await import('slash')).default;


  const args = [
    '-y',
    '-i',
    slash(inputPath),
    '-preset',
    'fast',
    '-g',
    '48',
    '-crf',
    '23',
    '-sc_threshold',
    '0',
  ];
  if (isHasAudio) {
    args.push('-map', '0:0', '-map', '0:1', '-map', '0:0', '-map', '0:1');
  } else {
    args.push('-map', '0:0', '-map', '0:0');
  }
  args.push(
    '-s:v:0',
    `${getWidth(720, resolution)}x720`,
    '-c:v:0',
    'libx264',
    '-b:v:0',
    `${bitrate[720]}`,
    '-s:v:1',
    `${getWidth(1080, resolution)}x1080`,
    '-c:v:1',
    'libx264',
    '-b:v:1',
    `${bitrate[1080]}`,
    '-c:a',
    'copy',
  );
  if (isHasAudio) {
    // Use Windows-safe var_stream_map (no name:...)
    args.push('-var_stream_map', '"v:0,a:0,name:0 v:1,a:1,name:1"');
  } else {
    args.push('-var_stream_map', '"v:0 v:1"');
  }
  args.push('-master_pl_name', 'master.m3u8');
  args.push('-f', 'hls');
  args.push('-hls_time', '10');
  args.push('-hls_list_size', '0');
  args.push('-hls_segment_filename', slash(outputSegmentPath));
  args.push(slash(outputPath));

  // console.log('FFMPEG output args:', slash(outputPath));

  console.log('FFMPEG ARGS:', args.join(' '));

    // await $`ffmpeg ${args}`;

  const process = spawn('ffmpeg', args, { stdio: 'inherit', shell: true });

  await new Promise((resolve, reject) => {
    process.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
    process.on('error', (err) => {
      reject(err);
    });
  });

  return true;
};

const encodeMax1440 = async ({
  bitrate,
  inputPath,
  isHasAudio,
  outputPath,
  outputSegmentPath,
  resolution,
}: EncodeByResolution) => {
  const { $ } = await import('zx');
  const slash = (await import('slash')).default;

  const args = [
    '-y',
    '-i',
    slash(inputPath),
    '-preset',
    'fast',
    '-g',
    '48',
    '-crf',
    '23',
    '-sc_threshold',
    '0',
  ];
  if (isHasAudio) {
    args.push(
      '-map',
      '0:0',
      '-map',
      '0:1',
      '-map',
      '0:0',
      '-map',
      '0:1',
      '-map',
      '0:0',
      '-map',
      '0:1',
    );
  } else {
    args.push('-map', '0:0', '-map', '0:0', '-map', '0:0');
  }
  args.push(
    '-s:v:0',
    `${getWidth(720, resolution)}x720`,
    '-c:v:0',
    'libx264',
    '-b:v:0',
    `${bitrate[720]}`,
    '-s:v:1',
    `${getWidth(1080, resolution)}x1080`,
    '-c:v:1',
    'libx264',
    '-b:v:1',
    `${bitrate[1080]}`,
    '-s:v:2',
    `${getWidth(1440, resolution)}x1440`,
    '-c:v:2',
    'libx264',
    '-b:v:2',
    `${bitrate[1440]}`,
    '-c:a',
    'copy',
  );
  if (isHasAudio) {
    args.push('-var_stream_map', '"v:0,a:0 v:1,a:1 v:2,a:2"');
  } else {
    args.push('-var_stream_map', '"v:0 v:1 v:2"');
  }
  args.push(
    '-master_pl_name',
    'master.m3u8',
    '-f',
    'hls',
    '-hls_time',
    '10',
    '-hls_list_size',
    '0',
    '-hls_segment_filename',
    slash(outputSegmentPath),
    slash(outputPath),
  );

  console.log('FFMPEG ARGS:', args.join(' '));

  const process = spawn('ffmpeg', args, { stdio: 'inherit', shell: true });

  await new Promise((resolve, reject) => {
    process.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
    process.on('error', (err) => {
      reject(err);
    });
  });

  return true;
};

const encodeMaxOriginal = async ({
  bitrate,
  inputPath,
  isHasAudio,
  outputPath,
  outputSegmentPath,
  resolution,
}: EncodeByResolution) => {
  const { $ } = await import('zx');
  const slash = (await import('slash')).default;

  const args = [
    '-y',
    '-i',
    slash(inputPath),
    '-preset',
    'fast',
    '-g',
    '48',
    '-crf',
    '23',
    '-sc_threshold',
    '0',
  ];
  if (isHasAudio) {
    args.push(
      '-map',
      '0:0',
      '-map',
      '0:1',
      '-map',
      '0:0',
      '-map',
      '0:1',
      '-map',
      '0:0',
      '-map',
      '0:1',
    );
  } else {
    args.push('-map', '0:0', '-map', '0:0', '-map', '0:0');
  }
  args.push(
    '-s:v:0',
    `${getWidth(720, resolution)}x720`,
    '-c:v:0',
    'libx264',
    '-b:v:0',
    `${bitrate[720]}`,
    '-s:v:1',
    `${getWidth(1080, resolution)}x1080`,
    '-c:v:1',
    'libx264',
    '-b:v:1',
    `${bitrate[1080]}`,
    '-s:v:2',
    `${resolution.width}x${resolution.height}`,
    '-c:v:2',
    'libx264',
    '-b:v:2',
    `${bitrate.original}`,
    '-c:a',
    'copy',
  );
  if (isHasAudio) {
    args.push(
      '-var_stream_map',
      '"v:0,a:0 v:1,a:1 v:2,a:2"'
    );
  } else {
    args.push(
      '-var_stream_map',
      '"v:0 v:1 v:2"');
  }
  args.push(
    '-master_pl_name',
    'master.m3u8',
    '-f',
    'hls',
    '-hls_time',
    '10',
    '-hls_list_size',
    '0',
    '-hls_segment_filename',
    slash(outputSegmentPath),
    slash(outputPath),
  );

  console.log('FFMPEG ARGS:', args.join(' '));

  const process = spawn('ffmpeg', args, { stdio: 'inherit', shell: true });

  await new Promise((resolve, reject) => {
    process.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
    process.on('error', (err) => {
      reject(err);
    });
  });

  return true;
};

export const encodeHLSWithMultipleVideoStreams = async (inputPath: string) => {
  const [bitrate, resolution, duration] = await Promise.all([
    getBitrate(inputPath),
    getResolution(inputPath),
    getDuration(inputPath),
  ]);
  const parent_folder = path.join(inputPath, '..');
  const outputSegmentPath = path.join(parent_folder, 'v%v/fileSequence%d.ts');
  const outputPath = path.join(parent_folder, 'v%v/prog_index.m3u8');
  const bitrate720 =
    bitrate > MAXIMUM_BITRATE_720P ? MAXIMUM_BITRATE_720P : bitrate;
  const bitrate1080 =
    bitrate > MAXIMUM_BITRATE_1080P ? MAXIMUM_BITRATE_1080P : bitrate;
  const bitrate1440 =
    bitrate > MAXIMUM_BITRATE_1440P ? MAXIMUM_BITRATE_1440P : bitrate;
  const isHasAudio = await checkVideoHasAudio(inputPath);
  let encodeFunc = encodeMax720;
  if (resolution.height > 720) {
    encodeFunc = encodeMax1080;
  }
  if (resolution.height > 1080) {
    encodeFunc = encodeMax1440;
  }
  if (resolution.height > 1440) {
    encodeFunc = encodeMaxOriginal;
  }
  await encodeFunc({
    bitrate: {
      720: bitrate720,
      1080: bitrate1080,
      1440: bitrate1440,
      original: bitrate,
    },
    inputPath,
    isHasAudio,
    outputPath,
    outputSegmentPath,
    resolution,
  });
  return {
    resolution,
    duration,
  };
};

async function retryUpload(fn: () => Promise<any>, retries = 3) {
  const sleep = await import('zx').then((m) => m.sleep);
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`🔁 Retry ${i + 1}: ${err.message}`);
      await sleep(1000);
    }
  }
}

export async function convertAndUploadToSupabase(
  videoId: string,
  mergedFilePath: string,
) {
  const mergedDir = path.dirname(mergedFilePath);
  const sleep = await import('zx').then((m) => m.sleep);

  console.log('🔁 Encoding HLS for:', mergedFilePath);
  let aspectInfo:
    | {
        fractionRatio: string;
        commonName: string;
      }
    | undefined;
  let width: number | undefined;
  let height: number | undefined;
  let inputDuration: number | undefined;

  try {
    const { resolution, duration } =
      await encodeHLSWithMultipleVideoStreams(mergedFilePath);
    console.log(`📏 Resolution: ${resolution.width}x${resolution.height}`);
    inputDuration = duration;
    console.log(`⏱ Duration: ${inputDuration} seconds`);
    aspectInfo = getAspectRatioInfo(resolution.width, resolution.height);
    width = resolution.width;
    height = resolution.height;
    console.log(
      `📏 Aspect Ratio: ${aspectInfo.fractionRatio} (${aspectInfo.commonName})`,
    );
    console.log('✅ Encoding completed successfully.');
  } catch (err) {
    console.error('❌ Encoding failed:', err.message);
  }

  try {
    const masterPath = path.join(mergedDir, 'master.m3u8');
    if (!fs.existsSync(masterPath)) {
      throw new Error('❌ master.m3u8 not found');
    }

    const masterContent = fs.readFileSync(masterPath, 'utf-8');
    const variantFolders = [
      ...masterContent.matchAll(/^(v\d+)\/prog_index\.m3u8$/gm),
    ].map((m) => m[1]);

    const uploadTasks: {
      supabasePath: string;
      filePath: string;
      contentType: string;
    }[] = [];

    // Push master.m3u8
    uploadTasks.push({
      supabasePath: `${videoId}/master.m3u8`,
      filePath: masterPath,
      contentType: 'application/vnd.apple.mpegurl',
    });

    // Push các file trong từng folder (v0, v1, ...)
    for (const folder of variantFolders) {
      const folderPath = path.join(mergedDir, folder);
      const files = fs.readdirSync(folderPath);
      for (const file of files) {
        uploadTasks.push({
          supabasePath: `${videoId}/${folder}/${file}`,
          filePath: path.join(folderPath, file),
          contentType: file.endsWith('.m3u8')
            ? 'application/vnd.apple.mpegurl'
            : 'video/MP2T',
        });
      }
    }

    console.log(`📦 Total files to upload: ${uploadTasks.length}`);

    const BATCH_SIZE = 10;
    for (let i = 0; i < uploadTasks.length; i += BATCH_SIZE) {
      const batch = uploadTasks.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(({ supabasePath, filePath, contentType }) =>
          retryUpload(() =>
            supabase.storage
              .from('videos')
              .upload(supabasePath, fs.createReadStream(filePath), {
                cacheControl: '3600',
                upsert: true,
                contentType,
                duplex: 'half',
              }),
          ),
        ),
      );

      results.forEach((result, idx) => {
        const taskIndex = i + idx + 1;
        if (result.status === 'fulfilled') {
          console.log(`✅ Uploaded file ${taskIndex}/${uploadTasks.length}`);
        } else {
          console.error(`❌ Failed file ${taskIndex}:`, result.reason.message);
        }
      });

      await sleep(1000); // delay 1s mỗi batch
    }

    if (aspectInfo) {
      await supabase.rpc('update_video_status_hls', {
        input_video_id: videoId,
        input_aspect_ratio: aspectInfo.fractionRatio,
        input_width: width,
        input_height: height,
        input_duration: inputDuration,
      });
      console.log('✅ All files uploaded to Supabase.');
    } else {
      throw new Error('Encoding failed, not updating video status on Supabase');
    }
  } catch (err) {
    console.error('❌ Upload process failed:', err.message);
    console.log('🧹 Cleaning up uploaded files...');
    await deleteSupabaseFolder(videoId);
  } finally {
    // Cleanup local files nếu cần
    // fs.rmSync(mergedDir, { recursive: true, force: true });
  }
}

export async function deleteSupabaseFolder(folderPath: string) {
  try {
    const { data, error } = await supabase.storage
      .from('videos')
      .list(folderPath, { limit: 1000 });

    if (error) {
      console.error('⚠️ Không thể liệt kê file để xóa:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log(`📂 Folder rỗng hoặc không tồn tại: ${folderPath}`);
      return;
    }

    const filesToDelete = data.map((f) => `${folderPath}/${f.name}`);
    const { error: deleteError } = await supabase.storage
      .from('videos')
      .remove(filesToDelete);

    if (deleteError) {
      console.error('❌ Xóa file trên Supabase thất bại:', deleteError.message);
    } else {
      console.log(
        `🧹 Đã xóa ${filesToDelete.length} file khỏi Supabase: ${folderPath}`,
      );
    }
  } catch (err) {
    console.error(
      '❌ Lỗi không xác định khi xóa Supabase folder:',
      err.message,
    );
  }
}

export function getAspectRatioInfo(
  width: number,
  height: number,
): {
  numberRatio: number;
  fractionRatio: string;
  commonName: string;
  orientation: 'portrait' | 'landscape' | 'square';
} {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

  const divisor = gcd(width, height);
  const simpleW = width / divisor;
  const simpleH = height / divisor;
  const ratio = parseFloat((width / height).toFixed(4));
  const fraction = `${simpleW}:${simpleH}`;

  const aspectMap: Record<string, string> = {
    '16:9': 'HD/Widescreen',
    '9:16': 'Vertical/Reels',
    '4:3': 'Standard',
    '1:1': 'Square',
    '21:9': 'Ultrawide',
  };

  const commonName = aspectMap[fraction] || 'Uncommon Ratio';

  const orientation =
    ratio > 1 ? 'landscape' : ratio < 1 ? 'portrait' : 'square';

  return {
    numberRatio: ratio,
    fractionRatio: fraction,
    commonName,
    orientation,
  };
}

export async function extractThumbnail(
  videoPath: string,
  videoId: string,
  seekTimeInSec = 1,
): Promise<string> {

  const slash = (await import('slash')).default;
  const { $, quote } = await import('zx');

  $.shell = 'cmd.exe';

  $.verbose = false;
  $.prefix = '';
  process.env.PATH = `C:\\ffmpeg\\bin;${process.env.PATH}`;  // add ffmpeg bin vào PATH


  const dir = path.join('public/assets/videos', videoId);
  const outputPath = path.join(dir, 'thumbnail.jpg');

  fs.mkdirSync(dir, { recursive: true });

  await $`ffmpeg -y -ss ${seekTimeInSec} -i ${slash(videoPath)} -frames:v 1 -q:v 2 ${slash(outputPath)}`;

  if (!fs.existsSync(outputPath)) {
    throw new BadRequestException('Thumbnail extraction failed');
  }

  return outputPath;
}




