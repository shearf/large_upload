var BIG_FILE_UPLOAD = {

	_getProcessPercent : function (num, total) {
		return Math.round(num / total * 100);
	},

	updateStatus : function(msg) {
		$('#upload_large_file_info').find('.upload_status').text(msg);
	},

	init : function() {

	},

	browseFile : function() {
		BIG_FILE_UPLOAD.updateStatus('选择文件');
	},

	loadFileComplete : function(file_name, file_size, send) {
		$('#upload_large_file_info').find('.file_name').text(file_name);
		$('#upload_large_file_info').find('.file_size').text(file_size);
		console.debug('load file info complete');
		var percent = BIG_FILE_UPLOAD._getProcessPercent(send, file_size);
		console.debug('get process');
		$('#upload_large_file_info').find('.upload_process').text(send + '/' + file_size + '(' + percent + '%)');
		BIG_FILE_UPLOAD.updateStatus('完成文件加载，可以开始上传');
	},

	startUpload : function () {
		BIG_FILE_UPLOAD.updateStatus('开始上传');
	},

	continueUpload : function () {
		BIG_FILE_UPLOAD.updateStatus('继续上传');
	},

	pauseUpload : function () {
		BIG_FILE_UPLOAD.updateStatus('暂停上传');
	},

	uploadProcess : function(file_size, send) {
		var percent = BIG_FILE_UPLOAD._getProcessPercent(send, file_size);
		$('#upload_large_file_info').find('.upload_process').text(send + '/' + file_size + '(' + percent + '%)');
		BIG_FILE_UPLOAD.updateStatus('正在上传');
	},

	cancelUpload : function() {
		BIG_FILE_UPLOAD.updateStatus('已经取消上传');
	},

	uploadComplete : function(path) {
		BIG_FILE_UPLOAD.updateStatus('上传完成，文件保存为项目下面的' + path);
	},

	uploadError : function(code, msg) {
		if (code === Html5LargeFileUpload.error_code.SIZE_LIMIT) {
			alert('选择的文件超出限制：限制上传大于' + msg + 'M的文件');
		}
		else if (code === Html5LargeFileUpload.error_code.FILE_TYPES) {
			alert('只能上传后缀为' + msg + '的文件');
		}
		else if (code === Html5LargeFileUpload.error_code.IO_ERROR) {
			alert('上传出错，无法上传文件到服务器');
		}
	}
	
};