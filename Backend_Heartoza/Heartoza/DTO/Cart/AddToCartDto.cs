namespace Heartoza.DTO.Cart
{
    public class AddToCartDto
    {
        public int UserId { get; set; }       // ID người dùng
        public int ProductId { get; set; }    // ID sản phẩm
        public int Quantity { get; set; }     // Số lượng muốn thêm
    }

}
